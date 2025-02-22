import { useEffect, useState } from 'react'

interface Option {
  value: any
  label: string
}

interface ClearableSelectProps {
  value?: any
  placeholder?: string
  options?: Option[]
  onChange?: (value: any) => void
}

export default function ClearableSelect(props: ClearableSelectProps) {
  const { options = [], value, placeholder, onChange } = props
  const [selectedOption, setSelectedOption] = useState(value)

  const handleOptionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value
    setSelectedOption(value)
    onChange && onChange(value)
  }

  const clearSelection = () => {
    setSelectedOption('')
    onChange && onChange(undefined)
  }

  useEffect(() => {
    setSelectedOption(value)
  }, [value])

  return (
    <div className="relative w-auto text-sm flex flex-nowarp shrink-0">
      <select
        value={selectedOption}
        onChange={handleOptionChange}
        className={`h-8 w-full pl-4 pr-8 appearance-none border rounded-sm box-border hover:border-gray-500 bg-white ${selectedOption ? 'text-black' : 'text-gray-400'}`}
      >
        {!selectedOption && <option value="">{placeholder || 'Select'}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={!option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <div className="flex h-4 w-4 items-center justify-center absolute right-2 top-1/2 transform -translate-y-1/2">
        {!!selectedOption ? (
          <button onClick={clearSelection} className="text-gray-500 hover:text-gray-800">
            &#10005;
          </button>
        ) : (
          <div className="pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
      </div>
    </div>
  )
}
