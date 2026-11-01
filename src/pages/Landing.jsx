import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  BookOpen,
  CalendarHeart,
  Camera,
  HeartPulse,
  Lock,
  Smile,
  Sparkles,
  Sunset,
} from 'lucide-react'
import Avatar from '../components/ui/Avatar'
import Button from '../components/ui/Button'
import Footer from '../components/layout/Footer'
import Logo from '../components/layout/Logo'
import MarketingNav from '../components/layout/MarketingNav'
import MoodBadge from '../components/updates/MoodBadge'
import { daysTogether } from '../lib/date'
import { couple } from '../lib/mockData'

const FEATURES = [
  {
    icon: Camera,
    title: 'A photo a day',
    body: 'Share the small thing you would have shown them in person. They open it the moment it lands.',
  },
  {
    icon: HeartPulse,
    title: 'Eight honest moods',
    body: 'Some days you are thriving. Some days you are just tired. Say it without writing a paragraph.',
  },
  {
    icon: Smile,
    title: 'Reactions, not comments',
    body: 'Tap love, miss you or proud. It answers them without starting a conversation you cannot finish.',
  },
  {
    icon: BookOpen,
    title: 'A memory that grows',
    body: 'Every update becomes part of a timeline you can walk back through, month by month.',
  },
  {
    icon: CalendarHeart,
    title: 'Countdowns that matter',
    body: 'Days together, and the hours until you finally close the distance again.',
  },
  {
    icon: Lock,
    title: 'Private by design',
    body: 'One couple, one space. No feed, no followers, nobody else reading over your shoulder.',
  },
]

const STEPS = [
  {
    number: '01',
    title: 'Create your space',
    body: 'Sign up and you get a private room for two. Nothing public, nothing to build an audience for.',
  },
  {
    number: '02',
    title: 'Invite your partner',
    body: 'Send them a six-digit code. They enter it, and the two of you are connected instantly.',
  },
  {
    number: '03',
    title: 'Show up daily',
    body: 'One photo, one mood, one line about your day. Ninety seconds, and they feel closer.',
  },
]

export default function Landing() {
  const { hash } = useLocation()

  // The footer reaches these anchors from the public legal pages, where the browser cannot
  // scroll to a fragment React has not rendered yet.
  useEffect(() => {
    if (!hash) return
    document.getElementById(hash.slice(1))?.scrollIntoView()
  }, [hash])

  return (
    <div className="min-h-dvh bg-cream-100">
      <MarketingNav />

      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-8 pt-14 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:pb-20 lg:pt-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3.5 py-1.5 text-xs font-semibold text-rose-700">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              For long-distance couples
            </span>

            <h1 className="mt-6 max-w-xl text-balance text-4xl leading-[1.1] text-ink-900 sm:text-5xl">
              Distance means so little when someone means so much.
            </h1>

            <p className="mt-6 max-w-md text-base leading-relaxed text-ink-500">
              Togetherly is a quiet, private space for two people apart. Share a photo, say how you
              feel, leave a line about your day — and watch three hundred small moments turn into a
              relationship you can look back on.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button to="/signup" size="lg">
                Get started — free
              </Button>
              <Button to="/login" variant="secondary" size="lg">
                Log in
              </Button>
            </div>

            <p className="mt-6 text-sm text-ink-500">
              Built for one couple. No feeds, no followers, no ads.
            </p>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-5xl border border-cream-200 bg-cream-50 shadow-lift">
              <img
                src="/mocks/hero-couple.png"
                alt="Two people sitting close together on a sunlit window seat"
                className="h-[26rem] w-full object-cover sm:h-[30rem]"
              />
            </div>

            <div className="surface absolute -bottom-6 -left-2 hidden max-w-[15rem] p-4 sm:block lg:-left-8">
              <div className="flex items-center gap-2.5">
                <Avatar initials="S" size="sm" />
                <div>
                  <p className="text-sm font-semibold text-ink-900">Sparkles · 8 min ago</p>
                  <MoodBadge moodId="missing_you" size="sm" className="mt-1" />
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink-500">
                Rained the whole walk home. All I wanted was your terrible playlist.
              </p>
            </div>

            <div className="absolute -right-1 top-6 hidden rounded-3xl border border-cream-200 bg-cream-50 px-4 py-3 shadow-soft lg:block">
              <p className="font-display text-2xl leading-none text-ink-900">
                {daysTogether(couple.anniversary).toLocaleString()}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-eyebrow text-ink-500">
                days together
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-20 sm:px-8">
        <div className="max-w-2xl">
          <h2 className="text-2xl text-ink-900 sm:text-3xl">Everything a daily check-in needs</h2>
          <p className="mt-4 text-base leading-relaxed text-ink-500">
            Nothing that asks you to perform. Nothing that pulls you into a feed. Just the few things
            that actually make distance feel shorter.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="surface p-6 transition-shadow duration-200 hover:shadow-lift">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-700">
                <feature.icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-5 text-lg text-ink-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="memories" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-12 sm:px-8">
        <div className="surface grid items-center gap-10 p-6 sm:p-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <h2 className="text-2xl text-ink-900 sm:text-3xl">Your relationship, kept properly</h2>
            <p className="mt-4 text-base leading-relaxed text-ink-500">
              Screenshots get lost in camera rolls. Togetherly files every photo, mood and message into
              one timeline you both own — grouped by month, so a whole year of long distance reads like
              a scrapbook instead of a chat log.
            </p>
            <ul className="mt-7 space-y-3">
              {[
                'Photo, mood and message kept together',
                'Organised automatically, month by month',
                'Tap any memory to reopen the full day',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-ink-700">
                  <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100">
                    <Sparkles className="h-3 w-3 text-rose-700" aria-hidden />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <img
              src="/mocks/update-goldenhour.png"
              alt="Golden hour on a coastal path"
              className="col-span-2 h-44 w-full rounded-4xl object-cover shadow-soft"
            />
            <img
              src="/mocks/update-cafe.png"
              alt="A cafe table with a latte and an open notebook"
              className="h-36 w-full rounded-3xl object-cover shadow-soft"
            />
            <img
              src="/mocks/update-picnic.png"
              alt="A picnic blanket with peaches and iced tea"
              className="h-36 w-full rounded-3xl object-cover shadow-soft"
            />
          </div>
        </div>
      </section>

      <section id="rituals" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-20 sm:px-8">
        <h2 className="text-center text-2xl text-ink-900 sm:text-3xl">Three steps, then it is yours</h2>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.number} className="surface p-6">
              <p className="font-display text-3xl text-rose-700">{step.number}</p>
              <h3 className="mt-4 text-lg text-ink-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-8 sm:px-8">
        <div className="rounded-5xl bg-rose-800 px-6 py-14 text-center shadow-lift sm:px-12">
          <Sunset className="mx-auto h-8 w-8 text-rose-200" aria-hidden />
          <h2 className="mx-auto mt-5 max-w-lg text-2xl leading-tight text-cream-50 sm:text-3xl">
            Tonight, tell them about your day properly.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-rose-100">
            Set up your shared space in under two minutes. Your partner just needs a code.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button to="/signup" size="lg" variant="secondary">
              Create your space
            </Button>
            <Button to="/login" size="lg" variant="ghost" className="text-rose-50 hover:bg-rose-900 hover:text-cream-50">
              I already have one
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Logo size="sm" />
          <p className="text-sm text-ink-500">
            Made for the people waiting at the other end of a phone call.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
