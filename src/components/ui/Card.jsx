export default function Card({ as: Tag = 'div', padded = true, hover = false, className = '', children, ...rest }) {
  return (
    <Tag
      className={`surface ${padded ? 'p-5 sm:p-6' : 'p-0'} ${
        hover ? 'transition-shadow duration-200 hover:shadow-lift' : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  )
}
