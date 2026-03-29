import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Users, Zap, Shield, Star, Crown } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Join Inner Circle - Exclusive Community Access',
  description: 'Join our exclusive Inner Circle community for premium content, networking opportunities, and direct access to industry experts.',
}

export default function InnerCircleJoinPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="flex justify-center mb-6">
              <Crown className="h-16 w-16 text-yellow-500" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Join the <span className="text-yellow-500">Inner Circle</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              Unlock exclusive access to premium content, networking opportunities, and direct connections with industry leaders.
              Be part of an elite community shaping the future of AI and technology.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button size="lg" className="bg-yellow-500 text-black hover:bg-yellow-400 text-lg px-8 py-4">
                Join Inner Circle - $99/month
              </Button>
              <Button variant="outline" size="lg" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Why Join the Inner Circle?
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              Exclusive benefits designed for serious professionals who want to stay ahead in the AI and tech industry.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-6xl">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Star className="h-8 w-8 text-yellow-500" />
                    <CardTitle className="text-white">Premium Content</CardTitle>
                  </div>
                  <CardDescription className="text-gray-300">
                    Access exclusive articles, research reports, and in-depth analysis not available to regular members.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Weekly exclusive newsletters
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Industry research reports
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Expert interviews and Q&As
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Users className="h-8 w-8 text-blue-500" />
                    <CardTitle className="text-white">Networking</CardTitle>
                  </div>
                  <CardDescription className="text-gray-300">
                    Connect with industry leaders, entrepreneurs, and fellow professionals in exclusive events.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Monthly virtual meetups
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Private Discord community
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Direct messaging with experts
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Zap className="h-8 w-8 text-purple-500" />
                    <CardTitle className="text-white">Early Access</CardTitle>
                  </div>
                  <CardDescription className="text-gray-300">
                    Get first access to new features, beta programs, and exclusive opportunities.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Beta feature access
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Priority support
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Exclusive job opportunities
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Shield className="h-8 w-8 text-green-500" />
                    <CardTitle className="text-white">Career Support</CardTitle>
                  </div>
                  <CardDescription className="text-gray-300">
                    Accelerate your career with personalized guidance and exclusive resources.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Resume reviews
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Career coaching sessions
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Interview preparation
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Crown className="h-8 w-8 text-yellow-500" />
                    <CardTitle className="text-white">VIP Perks</CardTitle>
                  </div>
                  <CardDescription className="text-gray-300">
                    Enjoy premium benefits and special treatment across our platform.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Featured profile badge
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Priority in search results
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Exclusive merchandise
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Users className="h-8 w-8 text-red-500" />
                    <CardTitle className="text-white">Community Impact</CardTitle>
                  </div>
                  <CardDescription className="text-gray-300">
                    Shape the future of our platform and community initiatives.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Vote on new features
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Suggest content topics
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Community leadership roles
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="py-24 sm:py-32 bg-gray-900">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Choose Your Membership
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              Flexible pricing options to fit your needs and budget.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-4xl">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Monthly</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-white">$99</span>
                    <span className="text-gray-400">/month</span>
                  </div>
                  <CardDescription className="text-gray-300">
                    Perfect for trying out the Inner Circle experience.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-yellow-500 text-black hover:bg-yellow-400">
                    Start Monthly Plan
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/50 relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-yellow-500 text-black">Most Popular</Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-white">Annual</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-white">$899</span>
                    <span className="text-gray-400">/year</span>
                  </div>
                  <div className="text-sm text-green-400 font-medium">
                    Save $289 (25% off)
                  </div>
                  <CardDescription className="text-gray-300">
                    Best value for committed members. Cancel anytime.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-yellow-500 text-black hover:bg-yellow-400">
                    Start Annual Plan
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Lifetime</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-white">$2,499</span>
                    <span className="text-gray-400">one-time</span>
                  </div>
                  <CardDescription className="text-gray-300">
                    Lifetime access with all future benefits included.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-yellow-500 text-black hover:bg-yellow-400">
                    Get Lifetime Access
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              Everything you need to know about the Inner Circle membership.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-3xl">
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-white">Can I cancel my membership anytime?</h3>
                <p className="mt-2 text-gray-300">
                  Yes, you can cancel your membership at any time. Your access will continue until the end of your current billing period.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">What payment methods do you accept?</h3>
                <p className="mt-2 text-gray-300">
                  We accept all major credit cards, PayPal, and bank transfers for annual and lifetime plans.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Do you offer refunds?</h3>
                <p className="mt-2 text-gray-300">
                  We offer a 30-day money-back guarantee for all membership plans. If you're not satisfied, we'll refund your payment.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Can I upgrade or downgrade my plan?</h3>
                <p className="mt-2 text-gray-300">
                  Yes, you can change your plan at any time. Upgrades take effect immediately, while downgrades apply at the next billing cycle.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 sm:py-32 bg-gradient-to-r from-gray-900 via-black to-gray-900">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to Join the Elite?
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              Don't miss out on this exclusive opportunity to connect with industry leaders and accelerate your career.
            </p>
            <div className="mt-10">
              <Button size="lg" className="bg-yellow-500 text-black hover:bg-yellow-400 text-lg px-8 py-4">
                Join Inner Circle Today
              </Button>
            </div>
            <p className="mt-4 text-sm text-gray-400">
              Join over 500+ professionals already in the Inner Circle
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}