import { z, ZodError } from 'zod'

export interface ToolInit {
  name: string
  description: string
  parameters: z.ZodObject<any>
  handler: (params: any) => Promise<any>
}

export type ToolHandle<P, R> = (params: P) => Promise<R>

export class Tool {
  protected _name: string
  protected _description: string
  protected _parameters: z.ZodObject<any, z.core.$strip>
  protected _handler: ToolHandle<any, any>

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
      parameters: z.toJSONSchema(this._parameters),
    }
  }

  constructor({ name, description, parameters, handler }: ToolInit) {
    this._name = name
    this._description = description
    this._parameters = parameters
    this._handler = handler
  }

  public validateParameters(params: any) {
    try {
      this._parameters.parse(params)
    } catch (error) {
      return error instanceof ZodError || error instanceof Error ? error.message : Object.prototype.toString.call(error)
    }

    return true
  }

  public call(params: any) {
    return this._handler(params)
  }
}

export function tool<T extends z.ZodRawShape>(name: string, description: string, parameters: z.ZodObject<T>, handler: ToolHandle<z.infer<typeof parameters>, any>) {
  return new Tool({ name, description, parameters, handler })
}
