import { getFieldsetProps, getFormProps, getInputProps, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node'
import { json, redirect } from '@remix-run/node'
import { Form, useActionData, useLoaderData, useParams } from '@remix-run/react'
import { useEffect } from 'react'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(5),
  thing: z.object({ name: z.string() }).optional(),
  remember: z.boolean().default(false),
})

const defaultValues = [
  {
    id: '1',
    email: 'dusty+one@postal.io',
    thing: { name: 'one' },
    remember: true,
  },
  {
    id: '2',
    email: 'dusty+2@postal.io',
    thing: { name: 'two' },
    remember: false,
  },
]

export async function loader({ params }: LoaderFunctionArgs) {
  const id = params.id as string
  return json(defaultValues.find((d) => d.id === id) ?? {})
}

export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData()
  const submission = parseWithZod(formData, { schema })
  if (submission.status !== 'success') {
    const data = submission.reply()
    console.log('error', data)
    return json(data)
  } else {
    const data = submission.value
    console.log('success', data)
    const next = Number(params.id) + 1
    return redirect(`/${next}`)
  }
}

export default function Login() {
  const loaderData = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const params = useParams()

  const [form, fields] = useForm({
    // setting a key will reset the form if the params id changes
    id: `user-${params.id}`,
    lastResult: actionData,
    // load the form data with the initial values from the loader
    defaultValue: { ...loaderData },
    // run html validation client side before submitting
    onValidate({ formData }) {
      return parseWithZod(formData, { schema })
    },
    shouldValidate: 'onBlur',
  })

  // this handles the nested object
  const other = fields.thing.getFieldset()

  useEffect(() => {
    console.log(JSON.stringify(actionData, null, 2))
  }, [actionData])

  return (
    <Form
      method="post"
      // sets all the accessiblility props
      {...getFormProps(form)}
      style={{ marginTop: '1rem' }}
    >
      <div id={form.errorId}>{form.errors}</div>
      <div>
        <label htmlFor={fields.email.id}>Email</label>
        <input {...getInputProps(fields.email, { type: 'email' })} />
        <span id={fields.email.errorId}>{fields.email.errors}</span>
      </div>
      <div>
        <label htmlFor={fields.password.id}>Password</label>
        <input {...getInputProps(fields.password, { type: 'password' })} />
        <span id={fields.password.errorId}>{fields.password.errors}</span>
      </div>
      <label htmlFor={fields.password.id}>
        <span>Remember me</span>
        <input {...getInputProps(fields.remember, { type: 'checkbox' })} />
      </label>
      <fieldset
        {...getFieldsetProps(fields.thing)}
        style={{ marginTop: '1rem' }}
      >
        <label htmlFor={other.name.id}>Other</label>
        <input {...getInputProps(other.name, { type: 'text' })} />
        <span id={other.name.errorId}>{other.name.errors}</span>
      </fieldset>
      <button style={{ marginTop: '1rem' }}>Login</button>
    </Form>
  )
}
