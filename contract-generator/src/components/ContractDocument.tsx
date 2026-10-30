import ReactMarkdown from "react-markdown";

export function ContractDocument({ text }: { text: string }) {
  return (
    <div className="prose-contract print-area">
      <ReactMarkdown>{text}</ReactMarkdown>
    </div>
  );
}
