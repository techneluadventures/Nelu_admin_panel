// Color-coded status pill for any status string

const STYLES = {
  applied:             'bg-blue-50 text-blue-700',
  shortlisted:         'bg-violet-50 text-violet-700',
  interview_scheduled: 'bg-indigo-50 text-indigo-700',
  interview_done:      'bg-cyan-50 text-cyan-700',
  selected:            'bg-teal-50 text-teal-700',
  rejected:            'bg-red-50 text-red-700',
  offer_sent:          'bg-purple-50 text-purple-700',
  offer_accepted:      'bg-green-50 text-green-700',
  offer_declined:      'bg-rose-50 text-rose-700',
  pre_boarding:        'bg-sky-50 text-sky-700',
  trial:               'bg-amber-50 text-amber-700',
  probation_extended:  'bg-orange-50 text-orange-700',
  trial_terminated:    'bg-red-100 text-red-800',
  docs_pending:        'bg-yellow-50 text-yellow-700',
  docs_submitted:      'bg-lime-50 text-lime-700',
  docs_verified:       'bg-emerald-50 text-emerald-700',
  confirmed:           'bg-green-100 text-green-800',
  active:              'bg-green-200 text-green-900',
  resigned:            'bg-gray-100 text-gray-600',
  terminated:          'bg-red-50 text-red-600',
  offboarded:          'bg-gray-200 text-gray-500',
  // document statuses
  pending:             'bg-yellow-50 text-yellow-700',
  verified:            'bg-green-50 text-green-700',
};

export default function StatusBadge({ status }) {
  const style = STYLES[status] || 'bg-gray-100 text-gray-500';
  const label = (status || '—').replace(/_/g, ' ');
  return (
    <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium capitalize ${style}`}>
      {label}
    </span>
  );
}
