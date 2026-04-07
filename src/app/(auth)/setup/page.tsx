import { createOrg } from '@/src/lib/actions/org.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { createClient } from '@/src/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Create your organization</CardTitle>
          <CardDescription>
            Set up your workspace to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createOrg} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="John Doe"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orgName">Organization Name</Label>
              <Input
                id="orgName"
                name="orgName"
                type="text"
                placeholder="Zecado Inc."
                required
              />
            </div>

            {params?.error && (
              <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-md">
                {params.error}
              </p>
            )}

            <Button type="submit" className="w-full">
              Create Organization
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
