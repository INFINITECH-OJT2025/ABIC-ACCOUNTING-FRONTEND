'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import Logo from '@/components/logo'

export default function ComponentsPage() {
  const [notification, setNotification] = useState('')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Logo animated={false} className="w-12 h-12" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">ABIC Components</h1>
                <p className="text-gray-600">Shadcn UI Component Showcase</p>
              </div>
            </div>
            <Link href="/login">
              <Button variant="outline">Back to Login</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <Tabs defaultValue="buttons" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="buttons">Buttons</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="badges">Badges</TabsTrigger>
            <TabsTrigger value="cards">Cards</TabsTrigger>
            <TabsTrigger value="colors">Colors</TabsTrigger>
          </TabsList>

          {/* Buttons Section */}
          <TabsContent value="buttons" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Button Variants</CardTitle>
                <CardDescription>Different button styles and states</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Default Button</p>
                    <Button>Click Me</Button>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Large Button</p>
                    <Button size="lg">Large Button</Button>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Small Button</p>
                    <Button size="sm">Small</Button>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Disabled Button</p>
                    <Button disabled>Disabled</Button>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Outline Button</p>
                    <Button variant="outline">Outline</Button>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Ghost Button</p>
                    <Button variant="ghost">Ghost</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alerts Section */}
          <TabsContent value="alerts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Alert Variants</CardTitle>
                <CardDescription>Different alert types for feedback</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Informational Alert</AlertTitle>
                  <AlertDescription>
                    This is an informational message. Use this for neutral information.
                  </AlertDescription>
                </Alert>

                <Alert className="bg-green-50 border-green-200 text-green-900">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-900">Success Alert</AlertTitle>
                  <AlertDescription className="text-green-800">
                    Your action was completed successfully!
                  </AlertDescription>
                </Alert>

                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error Alert</AlertTitle>
                  <AlertDescription>
                    Something went wrong. Please try again.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Badges Section */}
          <TabsContent value="badges" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Badge Variations</CardTitle>
                <CardDescription>Different badge styles and colors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge>Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                  <Badge variant="outline">Outline</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cards Section */}
          <TabsContent value="cards" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Card Title</CardTitle>
                  <CardDescription>This is a card description</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Card content goes here. You can add any content inside.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Interactive Card</CardTitle>
                  <CardDescription>Click the button below</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>This card contains interactive elements.</p>
                  <Button onClick={() => setNotification('Button clicked!')}>
                    Click Me
                  </Button>
                  {notification && <p className="text-green-600">{notification}</p>}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Colors Section */}
          <TabsContent value="colors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Color Palette</CardTitle>
                <CardDescription>ABIC Maroon gradient theme</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="w-full h-24 rounded-lg bg-[#8B0000] shadow-md"></div>
                    <p className="font-medium">Primary Maroon</p>
                    <p className="text-sm text-gray-600">#8B0000</p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-24 rounded-lg bg-[#A52A2A] shadow-md"></div>
                    <p className="font-medium">Maroon Accent</p>
                    <p className="text-sm text-gray-600">#A52A2A</p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-24 rounded-lg bg-[#5C0000] shadow-md"></div>
                    <p className="font-medium">Dark Maroon</p>
                    <p className="text-sm text-gray-600">#5C0000</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Documentation Section */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle>Quick Start Guide</CardTitle>
            <CardDescription>Getting started with Shadcn components</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Import Components</h3>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                {`import { Button } from '@/components/ui/button'
                import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
                import { Alert, AlertDescription } from '@/components/ui/alert'`}
                              </pre>
                            </div>

                            <div>
                              <h3 className="font-semibold mb-2">Use in Your Component</h3>
                              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                {`export default function MyComponent() {
                  return (
                    <Card>
                      <CardHeader>
                        <CardTitle>Hello World</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Button>Click Me</Button>
                      </CardContent>
                    </Card>
                  )
                }`}
              </pre>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Pro Tip</AlertTitle>
              <AlertDescription>
                You can install more shadcn components using: <code className="bg-gray-200 px-2 py-1 rounded">npx shadcn@latest add [component-name]</code>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
