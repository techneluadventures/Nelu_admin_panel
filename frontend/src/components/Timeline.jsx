// Vertical timeline showing candidate's workflow history
export default function Timeline({ events = [] }) {
  if (!events.length) return <p className="text-sm text-gray-400">No events yet.</p>;

  return (
    <div className="space-y-0">
      {events.map((e, i) => (
        <div key={e.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-2.5 h-2.5 rounded-full bg-gray-400 mt-1.5 flex-shrink-0 ring-2 ring-white" />
            {i < events.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" style={{ minHeight: 24 }} />}
          </div>
          <div className="pb-4">
            <p className="text-sm font-medium text-gray-800 capitalize">
              {e.event_type?.replace(/_/g, ' ')}
            </p>
            <p className="text-xs text-gray-400">
              {e.to_status && <span className="mr-2 capitalize">{e.to_status.replace(/_/g, ' ')}</span>}
              {e.users?.name && <span className="mr-2">by {e.users.name}</span>}
              {new Date(e.timestamp).toLocaleString('en-IN')}
            </p>
            {e.note && <p className="text-xs text-gray-500 mt-0.5 italic">{e.note}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
