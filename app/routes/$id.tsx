import { getFieldsetProps, getFormProps, getInputProps, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node'
import { json } from '@remix-run/node'
import { Form, Link, useActionData, useLoaderData, useParams } from '@remix-run/react'
import { z } from 'zod'

const serverSchema = z.object({
  email: z.string().email(),
  password: z.string().min(5, { message: 'It must be 5 dude' }),
  thing: z.object({ name: z.string() }).optional(),
  remember: z.boolean().default(false),
  tasks: z.array(z.string()),
})

// NOTE: these will usually be both
const clientSchema = serverSchema.extend({
  password: z.string(),
})

const defaultValues = [
  {
    id: '1',
    email: 'dusty+one@postal.io',
    thing: { name: 'one' },
    remember: true,
    tasks: ['1', '2'],
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

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  const submission = parseWithZod(formData, { schema: serverSchema })
  if (submission.status !== 'success') {
    const data = submission.reply()
    console.log('error', data)
    return json({ error: data, data: null })
  } else {
    const data = submission.value
    console.log('success', data)
    return json({ data, error: null })
  }
}

export default function Login() {
  const loaderData = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const params = useParams()

  const [form, fields] = useForm({
    // setting a key will reset the form if the params id changes
    id: `user-${params.id}`,
    lastResult: actionData?.error,
    // load the form data with the initial values from the loader
    defaultValue: { ...loaderData },
    // run html validation client side before submitting
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: clientSchema })
    },
    shouldValidate: 'onBlur',
  })

  // this handles the nested object
  const other = fields.thing.getFieldset()

  // this handles the array object
  const tasks = fields.tasks.getFieldList()

  const passwordInputProps = getInputProps(fields.password, { type: 'password' })
  const formProps = getFormProps(form)
  const fieldsetProps = getFieldsetProps(fields.thing)

  console.log('getFormProps', JSON.stringify(formProps, null, 2))
  console.log('getFieldsetProps', JSON.stringify(fieldsetProps, null, 2))
  console.log('getInputProps', JSON.stringify(passwordInputProps, null, 2))

  return (
    <div style={{ padding: '1rem' }}>
      {actionData?.data ? (
        <div>
          <p>Success!</p>
          <Link to={`/${Number(params.id) + 1}`}>Next</Link>
          <pre>{JSON.stringify(actionData.data, null, 2)}</pre>
        </div>
      ) : (
        <Form
          method="post"
          {...getFormProps(form)}
          style={{ display: 'flex', gap: '1rem', flexDirection: 'column', maxWidth: '600px' }}
        >
          <div id={form.errorId}>{form.errors}</div>

          <div>
            <label
              htmlFor={fields.email.id}
              style={{ display: 'block' }}
            >
              Email
            </label>
            <input {...getInputProps(fields.email, { type: 'email' })} />
            <p id={fields.email.errorId}>{fields.email.errors}</p>
          </div>

          <div>
            <label
              htmlFor={fields.password.id}
              style={{ display: 'block' }}
            >
              Password
            </label>
            <input {...getInputProps(fields.password, { type: 'password' })} />
            <p id={fields.password.errorId}>{fields.password.errors}</p>
          </div>

          <label htmlFor={fields.password.id}>
            <input {...getInputProps(fields.remember, { type: 'checkbox' })} />
            <span style={{ marginLeft: '10px' }}>Remember me</span>
          </label>

          <fieldset
            {...getFieldsetProps(fields.thing)}
            style={{ padding: '1rem' }}
          >
            <legend>Other</legend>
            <label
              htmlFor={other.name.id}
              style={{ display: 'block' }}
            >
              Name
            </label>
            <input {...getInputProps(other.name, { type: 'text' })} />
            <p id={other.name.errorId}>{other.name.errors}</p>
          </fieldset>

          <div>
            <p>
              Tasks{' '}
              <button
                {...form.insert.getButtonProps({ name: fields.tasks.name })}
                style={{ marginLeft: '10px' }}
              >
                Add task
              </button>
            </p>
            {tasks.map((task, index) => {
              return (
                <div key={task.key}>
                  <input {...getInputProps(task, { type: 'text' })} />
                  <button
                    {...form.remove.getButtonProps({ name: fields.tasks.name, index })}
                    style={{ margin: '10px' }}
                  >
                    remove
                  </button>
                  <span id={task.errorId}>{task.errors}</span>
                </div>
              )
            })}
          </div>

          <button style={{ marginTop: '1rem' }}>Submit</button>
        </Form>
      )}
    </div>
  )
}
