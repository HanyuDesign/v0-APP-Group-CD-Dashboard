"use client"

import type React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Plus,
  RefreshCw,
  Send,
  Signal,
  Truck,
  Wifi,
  ShieldCheck,
  Sparkles,
  Bell,
  Store,
  CreditCard,
  Wallet,
  Sparkle,
  Menu,
  Play,
  Pause,
  RotateCcw,
} from "lucide-react"

/* ------------------------------------------------------------------ */
/*  White-label skins                                                  */
/* ------------------------------------------------------------------ */

type Skin = {
  id: string
  name: string
  store: string
  brand: string
  brandDeep: string
  brandTint: string
  pharma: string
  pharmaTint: string
}

const SKINS: Record<string, Skin> = {
  mannings: {
    id: "mannings",
    name: "Mannings",
    store: "Mannings Causeway Bay",
    brand: "#EF7C00",
    brandDeep: "#B85C00",
    brandTint: "#FDEED9",
    // Mannings' signature green, used for the pharmacist role
    pharma: "#5A9E3F",
    pharmaTint: "#EAF4E2",
  },
  lumen: {
    id: "lumen",
    name: "Lumen Pharmacy",
    store: "Lumen Pharmacy Central",
    brand: "#4B4FBE",
    brandDeep: "#3A3E9E",
    brandTint: "#ECEDFA",
    pharma: "#3E5C76",
    pharmaTint: "#EAF0F5",
  },
}

/* ------------------------------------------------------------------ */
/*  Flow graph                                                         */
/* ------------------------------------------------------------------ */

type Stage = "check" | "fulfill" | "followup" | "care"

type CardKind =
  | "compare"
  | "store"
  | "pay"
  | "confirm-delivery"
  | "confirm-collect"
  | "seasonal"
  | "handoff"
  | "photo"
  | "booking"

type Chip = { label: string; next: string }

type FlowNode = {
  role: "assistant" | "pharmacist"
  stage: Stage
  messages: string[]
  card?: CardKind
  chips: Chip[]
  auto?: string
  autoDelay?: number
  dividerBefore?: string
  enterCheck?: boolean
  progress?: number
  completeCheck?: boolean
  replay?: boolean
}

const NODES: Record<string, FlowNode> = {
  greet: {
    role: "assistant",
    stage: "check",
    messages: [
      "Hi Sara, I'm your Wellness Specialist.",
      "Tell me what's bothering you and I'll help you sort it — I've got your skin profile and past orders handy.",
    ],
    chips: [
      { label: "My lips keep cracking", next: "check_enter" },
      { label: "Find something for dry skin", next: "nudge" },
      { label: "Help me read a label", next: "nudge" },
    ],
  },

  nudge: {
    role: "assistant",
    stage: "check",
    messages: ["Happy to help with that too! For this demo let's start with your lips."],
    chips: [{ label: "My lips keep cracking", next: "check_enter" }],
  },

  check_enter: {
    role: "assistant",
    stage: "check",
    enterCheck: true,
    progress: 0,
    messages: [
      "Let's do a quick Skin Check so I get you the right thing — takes about 20 seconds.",
      "First: how long has this been going on?",
    ],
    chips: [{ label: "About a week, sore in the corners", next: "check_q2" }],
  },

  check_q2: {
    role: "assistant",
    stage: "check",
    progress: 33,
    messages: [
      "Thanks — that's the dry-season humidity drop talking.",
      "Your file flags sensitive, fragrance-reactive skin, so I'll steer around anything that'd sting. Is your current balm helping at all?",
    ],
    chips: [{ label: "Not really, feels waxy but still cracks", next: "check_photo" }],
  },

  check_photo: {
    role: "assistant",
    stage: "check",
    progress: 50,
    messages: ["One last thing — a quick photo lets me read the cracking myself. Totally optional."],
    card: "photo",
    chips: [
      { label: "Add a photo", next: "check_done" },
      { label: "Skip", next: "check_done" },
    ],
  },

  check_done: {
    role: "assistant",
    stage: "check",
    progress: 66,
    completeCheck: true,
    messages: [
      "A plain petrolatum balm just seals the surface — it doesn't repair the barrier.",
      "And the barrier is what breaks down when the air dries out. Here's what fits your skin, side by side:",
    ],
    card: "compare",
    chips: [{ label: "Love it, where can I get it?", next: "fulfill" }],
  },

  fulfill: {
    role: "assistant",
    stage: "fulfill",
    messages: ["It's in stock near you, or I can have it delivered free by tomorrow. Your call:"],
    card: "store",
    chips: [
      { label: "Free next-day delivery, please", next: "pay_delivery" },
      { label: "I'll reserve & collect today", next: "pay_collect" },
    ],
  },

  pay_delivery: {
    role: "assistant",
    stage: "fulfill",
    messages: ["Almost there — here's how to pay. You've got enough points to cover it, so this one's on the house:"],
    card: "pay",
    chips: [
      { label: "Pay with points", next: "order_delivery" },
      { label: "Change payment method", next: "order_delivery" },
    ],
  },

  pay_collect: {
    role: "assistant",
    stage: "fulfill",
    messages: ["Almost there — here's how to pay. You've got enough points to cover it, so this one's on the house:"],
    card: "pay",
    chips: [
      { label: "Pay with points", next: "order_collect" },
      { label: "Change payment method", next: "order_collect" },
    ],
  },

  order_delivery: {
    role: "assistant",
    stage: "fulfill",
    messages: [
      "Done. Arriving tomorrow before noon, delivery's on us.",
      "I'll check back once it's had a few days to work.",
    ],
    card: "confirm-delivery",
    chips: [],
    auto: "timeskip",
    autoDelay: 8200,
  },

  order_collect: {
    role: "assistant",
    stage: "fulfill",
    messages: [
      "Reserved. Ready to collect at {store} within the hour.",
      "I'll check back in a few days to see how you're getting on.",
    ],
    card: "confirm-collect",
    chips: [],
    auto: "timeskip",
  },

  timeskip: {
    role: "assistant",
    stage: "followup",
    dividerBefore: "3 days later",
    messages: ["Hi Sara, your barrier repair balm has had a few days now — how are your lips feeling?"],
    chips: [
      { label: "So much better, thank you", next: "close_good" },
      { label: "Honestly, still sore", next: "escalate" },
    ],
  },

  close_good: {
    role: "assistant",
    stage: "followup",
    messages: [
      "Love that — dry spells come in waves this time of year.",
      "I've set a gentle reminder before the next cold snap and kept the matching overnight lip mask handy.",
      "Take care, Sara.",
    ],
    card: "seasonal",
    chips: [],
    replay: true,
  },

  escalate: {
    role: "assistant",
    stage: "care",
    messages: [
      "Soreness that won't settle after a few days can be more than dryness, and I won't guess on your skin. Let me bring in a pharmacist — a real person who can take a proper look.",
    ],
    card: "handoff",
    chips: [{ label: "Connect me to the pharmacist", next: "pharmacist" }],
  },

  pharmacist: {
    role: "pharmacist",
    stage: "care",
    messages: [
      "Hi Sara, I'm Daniel, pharmacist at {store}.",
      "Soreness at the corners that won't settle is sometimes more than dryness, so rather than guess, I'd like a quick look in person.",
      "Pop by when it suits and I'll have a couple of options ready so we choose together.",
    ],
    chips: [{ label: "Book a visit today", next: "end_care" }],
  },

  end_care: {
    role: "pharmacist",
    stage: "care",
    messages: ["Booked. Today 5:30pm at {store} — ask for Daniel at the pharmacy counter. See you soon."],
    card: "booking",
    chips: [],
    replay: true,
  },
}

/* ------------------------------------------------------------------ */
/*  Items rendered in the chat                                         */
/* ------------------------------------------------------------------ */

type Item =
  | { id: number; type: "assistant"; text: string }
  | { id: number; type: "pharmacist"; text: string }
  | { id: number; type: "user"; text: string }
  | { id: number; type: "card"; card: CardKind }
  | { id: number; type: "divider"; label: string }

type SkinCheckState = { active: boolean; progress: number; complete: boolean }

type Frame = {
  items: Item[]
  chips: Chip[]
  stage: Stage
  skinCheck: SkinCheckState
  showReplay: boolean
}

let _id = 0
const nid = () => ++_id

const fill = (text: string, skin: Skin) => text.replaceAll("{store}", skin.store)
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

/* ------------------------------------------------------------------ */
/*  Demo autoplay configuration                                        */
/* ------------------------------------------------------------------ */

type DemoPath = "pharmacist" | "resolved"

// Default predetermined branch taken at the check-in → handoff fork.
const DEMO_PATH: DemoPath = "pharmacist"
// Master multiplier scaling EVERY delay below (set live from the menu).
const SPEED = 1
// Composer typewriter cadence for customer turns.
const CHAR_MS = 45
const CHAR_JITTER = 15

// Pick the scripted chip for the current node along the chosen path.
function pickChip(chips: Chip[], path: DemoPath): Chip | undefined {
  if (chips.length <= 1) return chips[0]
  // the optional photo step always auto-skips during playback
  const skip = chips.find((c) => c.label === "Skip")
  if (skip) return skip
  if (path === "resolved") return chips.find((c) => c.next === "close_good") ?? chips[0]
  return chips.find((c) => c.next === "escalate") ?? chips[0]
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function WellnessSpecialist() {
  const [skin] = useState<Skin>(SKINS.mannings)
  const [items, setItems] = useState<Item[]>([])
  const [chips, setChips] = useState<Chip[]>([])
  const [stage, setStage] = useState<Stage>("check")
  const [typing, setTyping] = useState<null | "assistant" | "pharmacist" | "user">(null)
  const [skinCheck, setSkinCheck] = useState({ active: false, progress: 0, complete: false })
  const [showReplay, setShowReplay] = useState(false)
  const [typed, setTyped] = useState("")

  // ---- demo autoplay ----
  const [manual, setManual] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [playing, setPlaying] = useState(true)
  const [pathSel, setPathSel] = useState<DemoPath>(DEMO_PATH)
  const [speedSel, setSpeedSel] = useState(SPEED)
  const [composerCaret, setComposerCaret] = useState(false)
  const [sendPulse, setSendPulse] = useState(false)

  const pausedRef = useRef(false)
  const speedRef = useRef(SPEED)
  const pathRef = useRef<DemoPath>(DEMO_PATH)
  const endedRef = useRef(false)
  const manualRef = useRef(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // ---- step history for back/forth demo navigation ----
  const framesRef = useRef<Frame[]>([])
  const [frameCount, setFrameCount] = useState(0)
  const [cursor, setCursor] = useState(0) // index of the frame currently shown
  const atLive = cursor >= frameCount - 1

  const scrollRef = useRef<HTMLDivElement>(null)
  const runRef = useRef(0)
  const skinCheckRef = useRef(skinCheck)
  useEffect(() => {
    skinCheckRef.current = skinCheck
  }, [skinCheck])

  // keep autoplay refs in sync with their state so the running loop reads live values
  useEffect(() => {
    speedRef.current = speedSel
  }, [speedSel])
  useEffect(() => {
    pathRef.current = pathSel
  }, [pathSel])
  useEffect(() => {
    manualRef.current = manual
  }, [manual])

  // read ?manual=1 once on mount to start in clickable-chip mode
  useEffect(() => {
    if (typeof window === "undefined") return
    const wantsManual = new URLSearchParams(window.location.search).get("manual") === "1"
    if (wantsManual) {
      setManual(true)
      manualRef.current = true
      setPlaying(false)
    }
  }, [])

  // close the menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    window.addEventListener("mousedown", onDown)
    return () => window.removeEventListener("mousedown", onDown)
  }, [menuOpen])

  // scaled, pausable sleep: scales by live SPEED and parks while paused
  const napRef = useRef<(ms: number) => Promise<void>>(async () => {})
  napRef.current = async (ms: number) => {
    const scaled = ms / speedRef.current
    const start = performance.now()
    let waited = 0
    while (waited < scaled) {
      await sleep(Math.min(60, scaled - waited))
      while (pausedRef.current) await sleep(80)
      waited = performance.now() - start
    }
  }
  const nap = useCallback((ms: number) => napRef.current(ms), [])

  const applyFrame = useCallback((f: Frame) => {
    setItems(f.items)
    setChips(f.chips)
    setStage(f.stage)
    setSkinCheck(f.skinCheck)
    setShowReplay(f.showReplay)
  }, [])

  const recordFrame = useCallback(
    (f: Frame) => {
      framesRef.current = [...framesRef.current, f]
      setFrameCount(framesRef.current.length)
      setCursor(framesRef.current.length - 1)
    },
    [],
  )

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [items, typing, chips, skinCheck, typed])

  const playNode = useCallback(async (id: string, baseItems?: Item[]) => {
    const node = NODES[id]
    if (!node) return
    const myRun = ++runRef.current
    const alive = () => runRef.current === myRun
    const auto = !manualRef.current

    setChips([])
    setShowReplay(false)

    let working: Item[] = baseItems ?? []

    if (node.dividerBefore) {
      // time-skip divider: brief beat before it lands, then after
      if (auto) await nap(1500)
      if (!alive()) return
      working = [...working, { id: nid(), type: "divider", label: node.dividerBefore as string }]
      setItems(working)
      if (auto) await nap(1200)
      if (!alive()) return
    }

    if (node.enterCheck) setSkinCheck({ active: true, progress: 0, complete: false })
    if (typeof node.progress === "number") {
      const p = node.progress
      setSkinCheck((s) => ({ ...s, active: true, progress: p }))
    }

    for (let i = 0; i < node.messages.length; i++) {
      setTyping(node.role)
      // longer "typing" beat before a message that carries a card
      const carriesCard = node.card && i === node.messages.length - 1
      await (auto ? nap(carriesCard ? 1100 : 900) : sleep(i === 0 ? 800 : 650))
      if (!alive()) return
      setTyping(null)
      const text = node.messages[i]
      working = [...working, { id: nid(), type: node.role, text }]
      setItems(working)
      await (auto ? nap(220) : sleep(220))
      if (!alive()) return
    }

    if (node.card) {
      working = [...working, { id: nid(), type: "card", card: node.card as CardKind }]
      setItems(working)
      await (auto ? nap(150) : sleep(150))
      if (!alive()) return
    }

    let nextSkinCheck = skinCheckRef.current
    if (node.completeCheck) {
      nextSkinCheck = { active: true, progress: 100, complete: true }
      setSkinCheck(nextSkinCheck)
    }
    // leaving the Check stage retires the banner
    if (node.stage !== "check") {
      nextSkinCheck = { ...nextSkinCheck, active: false }
      setSkinCheck(nextSkinCheck)
    }

    setStage(node.stage)
    setChips(node.chips)
    setShowReplay(!!node.replay)

    // snapshot this settled frame for back/forth navigation
    recordFrame({
      items: working,
      chips: node.chips,
      stage: node.stage,
      skinCheck: nextSkinCheck,
      showReplay: !!node.replay,
    })

    // auto-advance to the next node without waiting for a user reply
    if (node.auto) {
      await (auto ? nap(node.autoDelay ?? 900) : sleep(node.autoDelay ?? 900))
      if (!alive()) return
      void playNode(node.auto, working)
      return
    }

    // hands-free customer turn: type the scripted reply into the composer,
    // send it, then advance — driving the whole conversation on its own
    if (auto && node.chips.length > 0) {
      const chip = pickChip(node.chips, pathRef.current)
      if (!chip) return

      // read pause scales with how much the specialist just said
      const lastMsg = node.messages[node.messages.length - 1] ?? ""
      let readPause = clamp(lastMsg.length * 35, 1200, 3500)
      if (node.card) readPause += 1500
      await nap(readPause)
      if (!alive()) return

      // typewriter the message into the input box, char by char
      setComposerCaret(true)
      let buf = ""
      for (const ch of chip.label) {
        buf += ch
        setTyped(buf)
        await nap(CHAR_MS + (Math.random() * 2 - 1) * CHAR_JITTER)
        if (!alive()) return
      }
      await nap(500)
      if (!alive()) return

      // pulse the send button, then "send"
      setSendPulse(true)
      await nap(220)
      setSendPulse(false)
      setComposerCaret(false)
      setTyped("")
      if (!alive()) return

      setTyping("user")
      await nap(450)
      if (!alive()) return
      setTyping(null)
      const sent: Item[] = [...working, { id: nid(), type: "user", text: chip.label }]
      setItems(sent)
      setChips([])
      await nap(220)
      if (!alive()) return
      void playNode(chip.next, sent)
      return
    }

    // reached an end node with no continuation — playback stops here
    if (auto && node.chips.length === 0 && !node.auto) {
      endedRef.current = true
      setPlaying(false)
    }
  }, [recordFrame, nap])

  const selectChip = useCallback(
    (chip: Chip) => {
      const current = framesRef.current[cursor]
      if (!current) return
      // branching from this frame discards any frames recorded after it
      framesRef.current = framesRef.current.slice(0, cursor + 1)
      setFrameCount(framesRef.current.length)
      setChips([])

      const myRun = ++runRef.current
      const alive = () => runRef.current === myRun

      // mirror the AI: show a three-dot "typing" indicator on the user's
      // side, then drop the finished bubble in all at once (no typewriter)
      setTyping("user")
      void (async () => {
        await sleep(550)
        if (!alive()) return
        setTyping(null)
        const base: Item[] = [...current.items, { id: nid(), type: "user", text: chip.label }]
        setItems(base)
        await sleep(180)
        if (!alive()) return
        void playNode(chip.next, base)
      })()
    },
    [playNode, cursor],
  )

  const goBack = useCallback(() => {
    if (cursor <= 0) return
    runRef.current++ // cancel any in-flight animation
    setTyping(null)
    const next = cursor - 1
    setCursor(next)
    applyFrame(framesRef.current[next])
  }, [cursor, applyFrame])

  const goForward = useCallback(() => {
    if (typing) return
    if (cursor < frameCount - 1) {
      // jump to an already-seen frame instantly
      const next = cursor + 1
      setCursor(next)
      applyFrame(framesRef.current[next])
      return
    }
    // at the live frontier: auto-advance using the primary suggested reply
    const liveChips = framesRef.current[cursor]?.chips ?? []
    if (liveChips.length > 0) selectChip(liveChips[0])
  }, [cursor, frameCount, typing, applyFrame, selectChip])

  const replay = useCallback(() => {
    runRef.current++
    framesRef.current = []
    setFrameCount(0)
    setCursor(0)
    setItems([])
    setChips([])
    setTyping(null)
    setTyped("")
    setComposerCaret(false)
    setSendPulse(false)
    setSkinCheck({ active: false, progress: 0, complete: false })
    setShowReplay(false)
    setStage("check")
    // restart resets playback state and applies the latest selected path
    endedRef.current = false
    pausedRef.current = false
    pathRef.current = pathSel
    if (!manualRef.current) setPlaying(true)
    void playNode("greet")
  }, [playNode, pathSel])

  // ---- demo controls (inside the hamburger menu) ----
  const togglePlay = useCallback(() => {
    // resuming after reaching the end restarts from the top
    if (endedRef.current) {
      replay()
      return
    }
    setPlaying((p) => {
      const next = !p
      pausedRef.current = !next
      return next
    })
  }, [replay])

  const setPath = useCallback((p: DemoPath) => {
    // applies on the next Restart, per spec
    setPathSel(p)
  }, [])

  const setSpeed = useCallback((s: number) => {
    setSpeedSel(s)
    speedRef.current = s
  }, [])

  const toggleManual = useCallback(() => {
    const next = !manualRef.current
    manualRef.current = next
    setManual(next)
    if (next) {
      // entering manual: stop autoplay, surface clickable chips
      pausedRef.current = false
      setPlaying(false)
      setTyped("")
      setComposerCaret(false)
      setSendPulse(false)
    } else {
      setPlaying(true)
    }
    // restart so the new mode takes effect cleanly from the top
    replay()
  }, [replay])

  // boot
  useEffect(() => {
    void playNode("greet")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const composerSend = useCallback(() => {
    if (!typed.trim() || typing) return
    setTyped("")
    // whatever the user types, advance the scripted flow via the primary suggested
    // reply — showing the scripted label, not the raw typed text
    const liveChips = framesRef.current[cursor]?.chips ?? []
    if (liveChips.length > 0) selectChip(liveChips[0])
  }, [typed, typing, cursor, selectChip])

  return (
    <div
      className="flex min-h-screen w-full items-center justify-center p-4"
      style={{ background: `linear-gradient(160deg, var(--app-bg-from), var(--app-bg-to))` }}
    >
      {/* phone frame */}
      <div
        className="relative flex aspect-[390/844] h-[min(844px,94svh)] w-auto max-w-[94vw] flex-col overflow-hidden rounded-[44px] border border-hairline bg-surface shadow-2xl shadow-black/20"
        style={
          {
            "--brand": skin.brand,
            "--brand-deep": skin.brandDeep,
            "--brand-tint": skin.brandTint,
            "--pharma": skin.pharma,
            "--pharma-tint": skin.pharmaTint,
          } as React.CSSProperties
        }
      >
        {/* status bar */}
        <div className="flex items-center justify-between px-7 pt-4 text-[13px] font-semibold text-ink">
          <span>10:04</span>
          <span className="flex items-center gap-1.5">
            <Signal className="h-3.5 w-3.5" />
            <Wifi className="h-3.5 w-3.5" />
            <span className="inline-block h-3 w-6 rounded-[3px] border border-muted-ink/60" />
          </span>
        </div>

        {/* header */}
        <header className="px-4 pb-2 pt-4">
          {/* row 1: menu · title */}
          <div className="relative flex items-center justify-between gap-2">
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Open menu"
                aria-expanded={menuOpen}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-soft transition active:scale-95 hover:bg-brand-tint"
              >
                <Menu className="h-5 w-5" />
              </button>
              {menuOpen && (
                <DemoMenu
                  playing={playing}
                  manual={manual}
                  path={pathSel}
                  speed={speedSel}
                  onTogglePlay={togglePlay}
                  onRestart={replay}
                  onSetPath={setPath}
                  onSetSpeed={setSpeed}
                  onToggleManual={toggleManual}
                />
              )}
            </div>

            <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2">
              <h1 className="whitespace-nowrap font-baloo text-[19px] font-semibold leading-none text-ink">Wellness Specialist</h1>
            </div>

            <span className="h-9 w-9 shrink-0" aria-hidden />
          </div>

          {/* row 2: demo step navigation */}
          <div className="mt-1.5 flex items-center justify-end gap-1.5">
            <button
              onClick={goBack}
              disabled={cursor <= 0}
              aria-label="Previous step"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-hairline bg-surface text-ink-soft transition active:scale-95 disabled:opacity-30 disabled:active:scale-100 hover:enabled:bg-brand-tint"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={goForward}
              disabled={!!typing || (atLive && (framesRef.current[cursor]?.chips.length ?? 0) === 0)}
              aria-label="Next step"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-hairline bg-surface text-ink-soft transition active:scale-95 disabled:opacity-30 disabled:active:scale-100 hover:enabled:bg-brand-tint"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* skin check banner */}
        {skinCheck.active && (
          <div className="mx-4 mb-1 va-rise rounded-2xl border border-coral/20 bg-coral-tint px-3.5 py-3 shadow-sm shadow-coral/5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-coral text-white shadow-sm shadow-coral/30">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div className="flex flex-1 items-center justify-between">
                <span className="text-[12.5px] font-semibold leading-none text-coral-deep">
                  {skinCheck.complete ? "Skin Check complete" : "Skin Check"}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-medium text-muted-ink">
                  {skinCheck.complete ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-coral" />
                      <span className="font-semibold text-coral-deep">Done</span>
                    </>
                  ) : (
                    <>
                      {"in progress · "}
                      <span className="font-semibold text-coral-deep">{skinCheck.progress}%</span>
                    </>
                  )}
                </span>
              </div>
            </div>
            <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-coral/15">
              <span
                className="block h-full rounded-full bg-coral transition-all duration-500 ease-out"
                style={{ width: `${skinCheck.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* chat scroll area */}
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 pb-3 pt-2">
          {items.map((item) => (
            <ItemRow key={item.id} item={item} skin={skin} liveChips={chips} onSelectChip={selectChip} />
          ))}

          {typing === "user" && (
            <div className="flex justify-end">
              <div className="w-fit rounded-2xl rounded-br-md bg-brand px-3 py-2.5">
                <ThinkingDots tone="light" />
              </div>
            </div>
          )}

          {typing && typing !== "user" && (
            <div className="flex gap-2">
              <Avatar role={typing} />
              <div className="flex flex-col gap-1">
                <span className="pl-1 text-[10px] font-medium text-muted-ink">
                  {typing === "pharmacist" ? "Pharmacist is typing…" : "Specialist is typing…"}
                </span>
                <div
                  className={`w-fit rounded-2xl rounded-tl-md px-3 py-2.5 ${
                    typing === "pharmacist" ? "bg-pharma-tint" : "bg-brand-tint"
                  }`}
                >
                  <ThinkingDots />
                </div>
              </div>
            </div>
          )}

          {/* suggested-reply chips — only in manual mode (hidden during autoplay) */}
          {manual && chips.length > 0 && atLive && !typing && (
            <div className="flex flex-col items-start gap-2 pt-1">
              {chips.map((c) => (
                <button
                  key={c.label}
                  onClick={() => selectChip(c)}
                  className="rounded-full border bg-surface px-4 py-2.5 text-left text-[14px] font-medium leading-snug transition active:scale-[0.98] hover:bg-brand-tint"
                  style={{ borderColor: "color-mix(in srgb, var(--brand) 35%, transparent)", color: "var(--brand-deep)" }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}

        </div>

        {/* composer */}
        <div className="px-4 pb-7 pt-3">
          <div className="flex items-center gap-2 rounded-full border border-hairline bg-white py-1.5 pl-4 pr-1.5">
            <div className="relative flex h-8 flex-1 items-center">
              {manual ? (
                <input
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && composerSend()}
                  placeholder="Message your specialist…"
                  className="h-8 w-full bg-transparent text-[15px] text-ink placeholder:text-muted-ink outline-none"
                />
              ) : (
                <div className="flex h-8 w-full items-center text-[15px] leading-none">
                  {typed ? (
                    <span className="text-ink">{typed}</span>
                  ) : (
                    !composerCaret && <span className="text-muted-ink">Message your specialist…</span>
                  )}
                  {composerCaret && (
                    <span className="va-caret ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[1px] rounded-full bg-brand" />
                  )}
                </div>
              )}
            </div>
            <button
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-ink transition hover:text-ink-soft"
              aria-label="Attach a photo"
            >
              <Camera className="h-5 w-5" />
            </button>
            <button
              onClick={composerSend}
              disabled={manual ? !typed.trim() : true}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-white transition active:scale-95 disabled:opacity-40 ${
                sendPulse ? "va-send-pulse" : ""
              }`}
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Avatars & dots                                                     */
/* ------------------------------------------------------------------ */

function DemoMenu({
  playing,
  manual,
  path,
  speed,
  onTogglePlay,
  onRestart,
  onSetPath,
  onSetSpeed,
  onToggleManual,
}: {
  playing: boolean
  manual: boolean
  path: DemoPath
  speed: number
  onTogglePlay: () => void
  onRestart: () => void
  onSetPath: (p: DemoPath) => void
  onSetSpeed: (s: number) => void
  onToggleManual: () => void
}) {
  return (
    <div className="va-rise absolute left-0 top-11 z-30 w-56 rounded-2xl border border-hairline bg-surface p-2 shadow-xl shadow-black/10">
      {/* primary playback actions (disabled in manual mode) */}
      <button
        onClick={onTogglePlay}
        disabled={manual}
        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[14px] font-semibold text-ink transition hover:bg-brand-tint disabled:opacity-40 disabled:hover:bg-transparent"
      >
        {playing ? <Pause className="h-4 w-4 text-brand-deep" /> : <Play className="h-4 w-4 text-brand-deep" />}
        {playing ? "Pause demo" : "Play demo"}
      </button>
      <button
        onClick={onRestart}
        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[14px] font-semibold text-ink transition hover:bg-brand-tint"
      >
        <RotateCcw className="h-4 w-4 text-brand-deep" />
        Restart demo
      </button>

      <div className="my-2 h-px bg-hairline" />

      {/* path selector — applies on next restart */}
      <div className="px-3 pb-1 pt-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-ink">Path</div>
      <div className="px-1 pb-1 text-[10.5px] text-muted-ink">Applies on next restart</div>
      {(
        [
          { id: "pharmacist" as const, label: "Pharmacist handoff" },
          { id: "resolved" as const, label: "Resolved" },
        ]
      ).map((opt) => (
        <button
          key={opt.id}
          onClick={() => onSetPath(opt.id)}
          className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[13.5px] font-medium text-ink transition hover:bg-brand-tint"
        >
          {opt.label}
          <span
            className={`flex h-4 w-4 items-center justify-center rounded-full border ${
              path === opt.id ? "border-brand bg-brand" : "border-muted-ink/40"
            }`}
          >
            {path === opt.id && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
          </span>
        </button>
      ))}

      <div className="my-2 h-px bg-hairline" />

      {/* live speed multiplier */}
      <div className="px-3 pb-1.5 pt-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-ink">Speed</div>
      <div className="flex gap-1.5 px-2 pb-1">
        {[1, 1.3, 1.5].map((s) => (
          <button
            key={s}
            onClick={() => onSetSpeed(s)}
            className={`flex-1 rounded-lg py-1.5 text-[13px] font-semibold transition ${
              speed === s ? "bg-brand text-white" : "bg-brand-tint/60 text-brand-deep hover:bg-brand-tint"
            }`}
          >
            {s}x
          </button>
        ))}
      </div>

      <div className="my-2 h-px bg-hairline" />

      {/* manual mode toggle */}
      <button
        onClick={onToggleManual}
        className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[14px] font-semibold text-ink transition hover:bg-brand-tint"
      >
        Manual mode
        <span
          className={`relative h-5 w-9 rounded-full transition ${manual ? "bg-brand" : "bg-muted-ink/30"}`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
              manual ? "left-[18px]" : "left-0.5"
            }`}
          />
        </span>
      </button>
    </div>
  )
}

function Avatar({ role }: { role: "assistant" | "pharmacist" }) {
  if (role === "pharmacist") {
    return (
      <div className="mt-5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pharma text-[10px] font-bold text-white ring-1 ring-black/5">
        DL
      </div>
    )
  }
  return (
    <div className="mt-5 h-7 w-7 shrink-0 overflow-hidden rounded-full bg-brand-tint ring-1 ring-black/5">
      <img src="/wellness-mascot.png" alt="Specialist" className="h-full w-full object-cover" />
    </div>
  )
}

function ThinkingDots({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`va-dot h-1.5 w-1.5 rounded-full ${tone === "light" ? "bg-white/80" : "bg-muted-ink"}`}
          style={{ animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </div>
  )
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="va-rise flex justify-end">
      <div className="max-w-[80%] rounded-2xl rounded-br-md bg-brand px-4 py-2.5 text-[15px] leading-relaxed text-white">
        {text}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Item renderer                                                      */
/* ------------------------------------------------------------------ */

function ItemRow({
  item,
  skin,
  liveChips,
  onSelectChip,
}: {
  item: Item
  skin: Skin
  liveChips: Chip[]
  onSelectChip: (chip: Chip) => void
}) {
  if (item.type === "divider") {
    return (
      <div className="va-rise flex items-center gap-3 py-1">
        <span className="h-px flex-1 border-t border-dashed border-hairline" />
        <span className="flex items-center gap-1.5 rounded-full bg-hairline/70 px-3 py-1 text-[11px] font-medium text-muted-ink">
          <Clock className="h-3 w-3" />
          {item.label}
        </span>
        <span className="h-px flex-1 border-t border-dashed border-hairline" />
      </div>
    )
  }

  if (item.type === "user") {
      return <UserBubble text={item.text} />
  }

  if (item.type === "assistant" || item.type === "pharmacist") {
    const pharma = item.type === "pharmacist"
    return (
      <div className="va-rise flex gap-2">
        <Avatar role={item.type} />
        <div className="flex max-w-[82%] flex-col gap-1">
          {pharma && <span className="pl-1 text-[10px] font-semibold text-pharma">Pharmacist</span>}
          <div
            className={`rounded-2xl rounded-tl-md px-4 py-2.5 text-[15px] leading-relaxed text-ink ${
              pharma ? "bg-pharma-tint" : "bg-brand-tint"
            }`}
          >
            {fill(item.text, skin)}
          </div>
        </div>
      </div>
    )
  }

  // card
  return (
    <div className="va-rise pl-9">
      <CardSwitch card={item.card} skin={skin} liveChips={liveChips} onSelectChip={onSelectChip} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Cards                                                              */
/* ------------------------------------------------------------------ */

function CardSwitch({
  card,
  skin,
  liveChips,
  onSelectChip,
}: {
  card: CardKind
  skin: Skin
  liveChips: Chip[]
  onSelectChip: (chip: Chip) => void
}) {
  switch (card) {
    case "photo":
      return <PhotoAffordance liveChips={liveChips} onSelectChip={onSelectChip} />
    case "compare":
      return <ComparisonCard />
    case "store":
      return <StoreDeliveryCard skin={skin} liveChips={liveChips} onSelectChip={onSelectChip} />
    case "pay":
      return <PaymentCard liveChips={liveChips} onSelectChip={onSelectChip} />
    case "confirm-delivery":
      return <OrderConfirmationCard variant="delivery" skin={skin} />
    case "confirm-collect":
      return <OrderConfirmationCard variant="collect" skin={skin} />
    case "seasonal":
      return <SeasonalPlanCard />
    case "handoff":
      return <PharmacistHandoffCard skin={skin} />
    case "booking":
      return <BookingCard skin={skin} />
    default:
      return null
  }
}

function PhotoAffordance({
  liveChips,
  onSelectChip,
}: {
  liveChips: Chip[]
  onSelectChip: (chip: Chip) => void
}) {
  const addChip = liveChips.find((c) => c.label === "Add a photo")
  const skipChip = liveChips.find((c) => c.label === "Skip")
  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-sm">
      {/* upload zone */}
      <div className="flex flex-col items-center gap-2 border-b border-hairline bg-brand-tint/40 px-4 py-5 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white shadow-sm">
          <Camera className="h-5 w-5" />
        </span>
        <p className="text-[14px] font-bold leading-tight text-ink">Add a photo of your lips</p>
        <p className="flex items-center gap-1 text-[11.5px] leading-snug text-muted-ink">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-brand" />
          Optional · auto-blurred for privacy
        </p>
      </div>
      {/* CTAs */}
      <div className="flex gap-2 p-3">
        {skipChip && (
          <button
            onClick={() => onSelectChip(skipChip)}
            className="flex-1 rounded-xl border border-hairline bg-white py-2.5 text-[13px] font-bold text-muted-ink transition active:scale-[0.99] hover:bg-brand-tint/40"
          >
            Skip
          </button>
        )}
        {addChip && (
          <button
            onClick={() => onSelectChip(addChip)}
            className="flex flex-[1.4] items-center justify-center gap-1.5 rounded-xl bg-brand py-2.5 text-[13px] font-bold text-white shadow-sm transition active:scale-[0.99] hover:opacity-95"
          >
            <Plus className="h-4 w-4 shrink-0" />
            Add a photo
          </button>
        )}
      </div>
    </div>
  )
}

function ComparisonCard() {
  const products = [
    {
      label: "Best fit",
      featured: true,
      img: "/lip-mask.png",
      brand: "Ceramide Repair",
      name: "Barrier Repair Lip Mask",
      price: "HK$129",
      meta: "Repairs barrier · fragrance-free",
    },
    {
      label: "Your current",
      featured: false,
      img: "/petrolatum-balm.png",
      brand: "EveryDay",
      name: "Petrolatum Balm",
      price: "HK$39",
      meta: "Seals only · no repair",
    },
  ]
  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-sm">
      {/* two product cards, side by side */}
      <div className="grid grid-cols-2">
        {products.map((p, i) => (
          <div
            key={p.name}
            className={`flex flex-col px-3 pt-3 pb-3.5 ${i === 0 ? "border-r border-hairline" : ""} ${
              p.featured ? "bg-brand-tint/40" : ""
            }`}
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-cloud">
              <img src={p.img || "/placeholder.svg"} alt={p.name} className="h-full w-full object-cover" />
              {p.featured && (
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-[9.5px] font-bold text-white shadow-sm">
                  <Sparkles className="h-2.5 w-2.5" />
                  {p.label}
                </span>
              )}
            </div>
            <p className="mt-2.5 text-[11px] text-muted-ink">{p.featured ? p.brand : p.label}</p>
            <p className="mt-0.5 text-[14px] font-bold leading-tight text-ink">{p.name}</p>
            <p className={`mt-1.5 text-[18px] font-bold ${p.featured ? "text-brand-deep" : "text-ink"}`}>{p.price}</p>
            <p className="mt-1 text-[11px] leading-snug text-muted-ink">{p.meta}</p>
          </div>
        ))}
      </div>

      {/* AI recommendation narrative */}
      <div className="flex items-start gap-2.5 border-t border-brand/15 bg-brand-tint/60 px-3.5 py-3">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-sm shadow-brand/30">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <p className="text-[15px] leading-relaxed text-ink-soft">
          Your balm only <span className="font-semibold text-ink">seals</span>. The{" "}
          <span className="font-semibold text-ink">Ceramide Barrier Repair Lip Mask</span> actually{" "}
          <span className="font-semibold text-ink">repairs the barrier</span> — fragrance-free. Wanna switch?
        </p>
      </div>
    </div>
  )
}

function StoreDeliveryCard({
  skin,
  liveChips,
  onSelectChip,
}: {
  skin: Skin
  liveChips: Chip[]
  onSelectChip: (chip: Chip) => void
}) {
  const options = [
    {
      icon: MapPin,
      title: `${skin.store} · 280m`,
      meta: "6 in stock · Reserve & collect today",
      next: "pay_collect",
    },
    {
      icon: Truck,
      title: "Free next-day delivery",
      meta: "Arrives before noon tomorrow",
      next: "pay_delivery",
    },
  ]
  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-sm">
      {/* fulfillment options */}
      <div className="px-3 pb-3 pt-3">
        {options.map((o, i) => {
          const Icon = o.icon
          const chip = liveChips.find((c) => c.next === o.next)
          const rowClass = `flex w-full items-center gap-3 py-2.5 text-left ${i > 0 ? "border-t border-hairline" : ""}`
          const body = (
            <>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-tint text-brand">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold leading-tight text-ink">{o.title}</p>
                <p className="mt-0.5 text-[11.5px] leading-snug text-muted-ink">{o.meta}</p>
              </div>
              {chip && <ChevronRight className="h-4 w-4 shrink-0 text-muted-ink" />}
            </>
          )
          return chip ? (
            <button
              key={o.title}
              onClick={() => onSelectChip(chip)}
              className={`${rowClass} -mx-1.5 rounded-xl px-1.5 transition active:scale-[0.99] hover:bg-brand-tint/60`}
            >
              {body}
            </button>
          ) : (
            <div key={o.title} className={rowClass}>
              {body}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PaymentCard({
  liveChips,
  onSelectChip,
}: {
  liveChips: Chip[]
  onSelectChip: (chip: Chip) => void
}) {
  const [showMethods, setShowMethods] = useState(false)
  const payChip = liveChips.find((c) => c.label.startsWith("Pay"))
  const changeChip = liveChips.find((c) => c.label.startsWith("Change"))
  const live = !!payChip

  const methods = [
    { icon: CreditCard, label: "Visa •••• 4291", meta: "Default card" },
    { icon: Wallet, label: "Apple Pay", meta: "Touch to confirm" },
  ]

  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-sm">
      {/* line item */}
      <div className="flex items-center justify-between px-3.5 pt-3.5">
        <div className="min-w-0">
          <p className="text-[14px] font-bold leading-tight text-ink">Ceramide Barrier Repair Balm</p>
          <p className="mt-0.5 text-[11.5px] text-muted-ink">1 item · Order total</p>
        </div>
        <span className="text-[16px] font-bold text-ink">HK$129</span>
      </div>

      {/* pay with points — primary */}
      <div className="px-3.5 pt-3">
        <button
          onClick={() => payChip && onSelectChip(payChip)}
          disabled={!live}
          className="flex w-full items-center gap-3 rounded-xl border border-brand/40 bg-brand-tint/60 px-3 py-3 text-left transition active:scale-[0.99] enabled:hover:bg-brand-tint disabled:cursor-default"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-white">
            <Sparkle className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-bold leading-tight text-ink">Pay with points</p>
            <p className="mt-0.5 text-[11.5px] leading-snug text-ink-soft">
              1,290 pts · covers it fully · 3,710 pts left
            </p>
          </div>
          <span className="rounded-full bg-brand px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            Free
          </span>
        </button>
      </div>

      {/* change payment method */}
      <div className="px-3.5 pb-3.5 pt-2">
        <button
          onClick={() => setShowMethods((s) => !s)}
          className="flex w-full items-center justify-between rounded-lg px-1 py-1.5 text-left transition hover:bg-hairline/40"
        >
          <span className="flex items-center gap-2 text-[12.5px] font-semibold text-brand-deep">
            <CreditCard className="h-4 w-4" />
            Change payment method
          </span>
          <ChevronRight className={`h-4 w-4 text-muted-ink transition ${showMethods ? "rotate-90" : ""}`} />
        </button>

        {showMethods && (
          <div className="mt-2 va-rise overflow-hidden rounded-xl border border-hairline">
            {methods.map((m, i) => {
              const Icon = m.icon
              return (
                <button
                  key={m.label}
                  onClick={() => changeChip && onSelectChip(changeChip)}
                  disabled={!changeChip}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition active:scale-[0.99] enabled:hover:bg-brand-tint/50 disabled:cursor-default ${
                    i > 0 ? "border-t border-hairline" : ""
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0 text-ink-soft" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold leading-tight text-ink">{m.label}</p>
                    <p className="text-[11px] text-muted-ink">{m.meta}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-ink" />
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function OrderConfirmationCard({ variant, skin }: { variant: "delivery" | "collect"; skin: Skin }) {
  if (variant === "delivery") {
    return <LiveDeliveryTracker />
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-sm">
      <div className="flex items-center gap-3 px-3 py-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-tint text-brand">
          <Check className="h-5 w-5" strokeWidth={2.5} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-ink">Order #MNG-48217</p>
          <p className="text-[11px] text-muted-ink">{`Collect at ${skin.store}`}</p>
        </div>
        <span className="rounded-full bg-brand-tint px-2.5 py-1 text-[10px] font-semibold text-brand-deep">
          Collect
        </span>
      </div>
      <div className="flex items-center justify-between border-t border-hairline px-3 py-2.5">
        <span className="flex items-center gap-1.5 text-[12px] text-ink-soft">
          <Clock className="h-3.5 w-3.5 text-muted-ink" />
          Ready within 1 hour
        </span>
        <span className="text-[12px] font-semibold text-brand-deep">Track order</span>
      </div>
    </div>
  )
}

const DELIVERY_STEP_MS = 1600

const DELIVERY_STAGES = [
  { title: "Order confirmed", sub: "Order #MNG-48217 · paid with points" },
  { title: "Packed & ready", sub: "Leaving the fulfillment centre" },
  { title: "Out for delivery", sub: "Rider Chen is heading your way" },
  { title: "Arriving before noon", sub: "Tomorrow before 12:00pm" },
  { title: "Delivered", sub: "Left at your door · 11:42am" },
]

function LiveDeliveryTracker() {
  const [stage, setStage] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (stage >= DELIVERY_STAGES.length - 1) return
    const t = setTimeout(() => setStage((s) => Math.min(s + 1, DELIVERY_STAGES.length - 1)), DELIVERY_STEP_MS)
    return () => clearTimeout(t)
  }, [stage])

  const current = DELIVERY_STAGES[stage]
  const done = stage >= DELIVERY_STAGES.length - 1

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => {
      setStage((s) => Math.min(s + 1, DELIVERY_STAGES.length - 1))
      setRefreshing(false)
    }, 650)
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-surface px-3 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-tint text-brand">
          {done ? <Check className="h-5 w-5" strokeWidth={2.5} /> : <Clock className="h-[18px] w-[18px]" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-bold leading-tight text-ink">{current.title}</p>
          <p className="mt-0.5 text-[11.5px] leading-snug text-muted-ink">{current.sub}</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={done || refreshing}
          aria-label="Refresh delivery status"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-ink transition enabled:hover:bg-hairline/50 enabled:hover:text-ink-soft disabled:opacity-40"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* segmented progress bar */}
      <div className="mt-3 flex gap-1.5">
        {DELIVERY_STAGES.map((_, i) => (
          <span key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-hairline">
            <span
              className="block h-full rounded-full bg-brand transition-[width] duration-700 ease-out"
              style={{ width: i <= stage ? "100%" : "0%" }}
            />
          </span>
        ))}
      </div>
    </div>
  )
}

function SeasonalPlanCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-surface p-3 shadow-sm">
      <p className="mb-2 text-[12px] font-semibold text-ink">Added to your seasonal plan</p>
      <div className="flex items-center gap-2 rounded-xl border border-hairline px-3 py-2.5">
        <Bell className="h-4 w-4 shrink-0 text-brand" />
        <span className="flex-1 text-[13px] text-ink-soft">Cold-snap reminder</span>
        <span className="flex h-5 w-9 items-center rounded-full bg-brand px-0.5">
          <span className="ml-auto h-4 w-4 rounded-full bg-white" />
        </span>
      </div>
      <div className="mt-2 rounded-xl border border-hairline px-3 py-2.5">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-coral-tint">
            <img src="/lip-mask.png" alt="Overnight lip mask" className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-semibold leading-tight text-ink">Overnight Lip Mask</p>
            <p className="mt-0.5 text-[11px] leading-snug text-muted-ink text-pretty">
              Matches your barrier repair routine
            </p>
          </div>
        </div>
        <button className="mt-2.5 w-full rounded-full border border-brand/40 py-2 text-[12px] font-semibold whitespace-nowrap text-brand-deep transition hover:bg-brand-tint/60 active:scale-[0.99]">
          Add to next order
        </button>
      </div>
    </div>
  )
}

function BookingCard({ skin }: { skin: Skin }) {
  const slots = ["Today 5:30pm", "Today 6:15pm", "Tomorrow 10:00am", "Tomorrow 2:30pm"]
  const [selected, setSelected] = useState(slots[0])
  const [open, setOpen] = useState(false)

  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-surface p-3 shadow-sm">
      {/* confirmed slot */}
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pharma text-white">
          <Check className="h-5 w-5" strokeWidth={2.5} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-bold text-ink">{selected}</p>
          <p className="flex items-center gap-1 truncate text-[11.5px] text-muted-ink">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-pharma" />
            {skin.store}
          </p>
        </div>
      </div>

      {/* see other available times */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-pharma/30 py-2.5 text-[13px] font-semibold text-pharma transition active:scale-[0.98] hover:bg-pharma-tint"
      >
        <Clock className="h-4 w-4" />
        {open ? "Hide other times" : "See other available times"}
      </button>

      {open && (
        <div className="va-rise mt-2 flex flex-col gap-1.5">
          {slots.map((slot) => {
            const active = slot === selected
            return (
              <button
                key={slot}
                onClick={() => {
                  setSelected(slot)
                  setOpen(false)
                }}
                className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-[13px] font-medium transition active:scale-[0.99] ${
                  active
                    ? "border-pharma bg-pharma-tint text-pharma"
                    : "border-hairline bg-white text-ink hover:bg-pharma-tint/50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-muted-ink" />
                  {slot}
                </span>
                {active && <Check className="h-4 w-4 text-pharma" strokeWidth={2.5} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function PharmacistHandoffCard({ skin }: { skin: Skin }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-surface p-3 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pharma text-[13px] font-bold text-white">
          DL
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-bold text-ink">Daniel · Pharmacist</p>
          <p className="flex items-center gap-1.5 truncate text-[11.5px] font-medium text-pharma">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-pharma" />
            Available now
          </p>
        </div>
      </div>
      <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-pharma py-2.5 text-[13px] font-semibold text-white transition active:scale-[0.98]">
        <Store className="h-4 w-4" />
        Connect now
      </button>
    </div>
  )
}
