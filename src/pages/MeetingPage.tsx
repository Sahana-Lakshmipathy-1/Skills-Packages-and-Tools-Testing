import { Meeting } from '../components/meeting/Meeting'
import { useMeetingContext } from '../hooks/useMeetingContext'

export function MeetingPage() {
  const { meta } = useMeetingContext()
  const hasVisible = meta.visibleMeetings.length > 0

  return (
    <Meeting.Frame>
      <Meeting.Heading>Plan this month without overlaps.</Meeting.Heading>
      <Meeting.Form />
      {hasVisible ? (
        <Meeting.List>
          {meta.visibleMeetings.map((meeting) => (
            <Meeting.Item key={meeting.id} meeting={meeting} />
          ))}
        </Meeting.List>
      ) : (
        <Meeting.Empty>
          No meetings this month. Add one above — overlaps are blocked.
        </Meeting.Empty>
      )}
    </Meeting.Frame>
  )
}
