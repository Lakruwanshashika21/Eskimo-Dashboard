export const Card = ({ children, className }) => <div className={`rounded-xl overflow-hidden ${className}`}>{children}</div>;
export const CardHeader = ({ children, className }) => <div className={`p-4 border-b ${className}`}>{children}</div>;
export const CardTitle = ({ children, className }) => <h3 className={`font-bold ${className}`}>{children}</h3>;
export const CardContent = ({ children, className }) => <div className={`p-4 ${className}`}>{children}</div>;