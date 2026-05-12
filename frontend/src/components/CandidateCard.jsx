import Link from 'next/link';
import StatusBadge from './StatusBadge';

// A compact card for displaying a candidate in a list.

export default function CandidateCard({ candidate }) {
  return (
    <Link href={`/candidates/${candidate.id}`}
      className="block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">{candidate.full_name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{candidate.email}</p>
          <p className="text-xs text-gray-400">{candidate.roles?.role_name}</p>
        </div>
        <StatusBadge status={candidate.status} />
      </div>
    </Link>
  );
}
