interface EmptyStateProps {
  title: string;
  description: string;
}

export default function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="text-center py-20 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-white">
      <p className="text-lg font-medium">{title}</p>
      <p className="text-sm mt-1">{description}</p>
    </div>
  );
}
