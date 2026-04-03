import { redirect } from 'next/navigation'
import { processInvitation } from '@/src/lib/actions/auth.actions'

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>
}) {
  const { token, error } = await searchParams

  if (!token) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border bg-white p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">You've Been Invited</h1>
          <p className="text-gray-500">Create your account to join the workspace.</p>
        </div>

        {error && (
          <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form action={processInvitation} className="space-y-4">
          <input type="hidden" name="token" value={token} />
          
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">Full Name</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="w-full rounded-md border p-2 text-sm"
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full rounded-md border p-2 text-sm"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-black p-2 text-white hover:bg-gray-800"
          >
            Create Account & Join
          </button>
        </form>
      </div>
    </div>
  )
}