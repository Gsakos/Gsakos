import ReactMarkdown from "react-markdown";

export function ContractDocument({ text }: { text: string }) {
  return (
    <div className="prose-contract print-area text-slate-800 dark:text-slate-100">
      <ReactMarkdown>{text}</ReactMarkdown>
    </div>
  );
}
