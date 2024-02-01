import { Link } from '@remix-run/react'

export default function Component() {
  return (
    <ul>
      <li>
        <Link to="/1">One</Link>
      </li>
      <li>
        <Link to="/2">Two</Link>
      </li>
    </ul>
  )
}
