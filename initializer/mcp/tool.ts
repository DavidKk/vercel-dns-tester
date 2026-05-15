import type { z } from 'zod'
import { toJSONSchema, ZodError } from 'zod'

export interface ToolInit {
  name: string
  description: string
  parameters: z.ZodObject<z.ZodRawShape>
  handler: (params: unknown) => Promise<unknown>
}

export type ToolHandle<P, R> = (params: P) => Promise<R>

/**
 * MCP tool definition with Zod-validated parameters and async handler.
 */
export class Tool {
  protected _name: string
  protected _description: string
  protected _parameters: z.ZodObject<z.ZodRawShape>
  protected _handler: ToolHandle<unknown, unknown>

  public get name() {
    return this._name
  }

  public get description() {
    return this._description
  }

  public get manifest() {
    return {
      name: this.name,
      description: this.description,
      parameters: toJSONSchema(this._parameters),
    }
  }

  constructor({ name, description, parameters, handler }: ToolInit) {
    this._name = name
    this._description = description
    this._parameters = parameters
    this._handler = handler
  }

  /**
   * Validate caller arguments against the Zod schema.
   * @param params Raw arguments from MCP client
   * @returns True when valid, otherwise an error message string
   */
  public validateParameters(params: unknown) {
    try {
      this._parameters.parse(params)
    } catch (error) {
      return error instanceof ZodError || error instanceof Error ? error.message : Object.prototype.toString.call(error)
    }

    return true
  }

  /**
   * Invoke the tool handler with validated parameters.
   * @param params Raw arguments (caller should validate first)
   * @returns Handler result
   */
  public call(params: unknown) {
    return this._handler(params)
  }
}

/**
 * Define an MCP tool with a Zod parameter object and async handler.
 * @param name Tool name exposed to MCP clients
 * @param description Human-readable description
 * @param parameters Zod object schema for arguments
 * @param handler Implementation
 * @returns Tool instance
 */
export function tool<T extends z.ZodRawShape>(name: string, description: string, parameters: z.ZodObject<T>, handler: ToolHandle<z.infer<typeof parameters>, unknown>) {
  return new Tool({
    name,
    description,
    parameters,
    handler: handler as (params: unknown) => Promise<unknown>,
  })
}
