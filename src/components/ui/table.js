export const Table = ({ children }) => <table className="w-full text-left border-collapse">{children}</table>;
export const TableBody = ({ children }) => <tbody>{children}</tbody>;
export const TableRow = ({ children, className }) => <tr className={`border-b border-slate-800/50 ${className}`}>{children}</tr>;
export const TableCell = ({ children, className }) => <td className={`p-2 ${className}`}>{children}</td>;