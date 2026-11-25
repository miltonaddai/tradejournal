import { useEffect, useRef, useState } from 'react'
import { format, isToday, parseISO } from 'date-fns'
import { Calendar } from 'lucide-react'
import { AppLayout } from '@/components/layout/Sidebar'
import { GlassCard } from '@/components/layout/GlassCard'
import { Button } from '@/components/ui/button'
import { JournalCalendarModal } from '@/components/journal/JournalCalendarModal'
import { RichTextEditor } from '@/components/journal/RichTextEditor'
import { api } from '@/lib/api'
import { useJournalStore } from '@/stores'

function todayString() {
  return format(new Date(), 'yyyy-MM-dd')
}

export function JournalPage() {
  const [selectedDate, setSelectedDate] = useState(todayString)
  const [content, setContent] = useState('')
  const [calendarOpen, setCalendarOpen] = useState(false)
  const skipSaveRef = useRef(true)

  const entriesByDate = useJournalStore((state) => state.entriesByDate)
  const loadingDate = useJournalStore((state) => state.loadingDate)
  const fetchEntry = useJournalStore((state) => state.fetchEntry)
  const setEntry = useJournalStore((state) => state.setEntry)

  const cachedEntry = entriesByDate[selectedDate]
  const loaded = Boolean(cachedEntry) && loadingDate !== selectedDate

  useEffect(() => {
    skipSaveRef.current = true

    const cached = useJournalStore.getState().entriesByDate[selectedDate]
    if (cached) {
      setContent(cached.content)
      skipSaveRef.current = false
      return
    }

    fetchEntry(selectedDate).then((entryContent) => {
      setContent(entryContent)
      skipSaveRef.current = false
    })
  }, [fetchEntry, selectedDate])

  useEffect(() => {
    if (!loaded || skipSaveRef.current) return

    const timer = setTimeout(() => {
      api.journal.save(selectedDate, content).catch(() => {})
      setEntry(selectedDate, content)
    }, 800)

    return () => clearTimeout(timer)
  }, [content, loaded, selectedDate, setEntry])

  const parsedDate = parseISO(selectedDate)
  const dateLabel = isToday(parsedDate)
    ? `Today, ${format(parsedDate, 'EEEE, MMMM do yyyy')}`
    : format(parsedDate, 'EEEE, MMMM do yyyy')

  return (
    <AppLayout>
      <h1 className="mb-10 text-2xl font-body">Journal Entries</h1>

      <div className="mb-6 flex items-center justify-between">
        <GlassCard variant="pill" className="px-4 py-2 text-sm">
          {dateLabel}
        </GlassCard>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setCalendarOpen(true)}
        >
          <Calendar className="h-4 w-4" />
          Select date
        </Button>
      </div>

      <GlassCard className="p-1">
        {loaded ? (
          <RichTextEditor key={selectedDate} content={content} onChange={setContent} />
        ) : (
          <div className="flex min-h-[38rem] items-center justify-center text-sm text-white/40">
            Loading entry…
          </div>
        )}
      </GlassCard>

      <JournalCalendarModal
        open={calendarOpen}
        onOpenChange={setCalendarOpen}
        selectedDate={selectedDate}
        onSelect={setSelectedDate}
      />
    </AppLayout>
  )
}
