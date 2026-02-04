import { ChevronDown } from "lucide-react";

interface UserSelectorProps {
  value: string;
  onChange: (value: string) => void;
  users: { id: string; name: string }[];
}

const UserSelector = ({ value, onChange, users }: UserSelectorProps) => {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-card border border-border rounded-lg px-4 py-3 text-foreground 
                   appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50
                   focus:border-primary transition-colors"
      >
        <option value="">Seleccione un usuario...</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
    </div>
  );
};

export default UserSelector;
