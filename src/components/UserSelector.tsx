import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

interface UserSelectorProps {
  value: string;
  onChange: (value: string) => void;
  users: {
    id: string;
    name: string;
    displayName: string;
    ageCategory: "menor" | "mayor" | "unknown";
  }[];
}

const UserSelector = ({ value, onChange, users }: UserSelectorProps) => {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedUser = users.find((user) => user.id === value);

  useEffect(() => {
    if (!isOpen) {
      setSearch(selectedUser?.displayName || "");
    }
  }, [isOpen, selectedUser]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return users;

    return users.filter((user) =>
      user.displayName.toLowerCase().includes(normalizedSearch),
    );
  }, [search, users]);

  const getAgeLabel = (ageCategory: "menor" | "mayor" | "unknown") => {
    if (ageCategory === "mayor") return "+18";
    if (ageCategory === "menor") return "-18";
    return "Edad sin definir";
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        type="search"
        value={search}
        onFocus={() => setIsOpen(true)}
        onChange={(e) => {
          setSearch(e.target.value);
          setIsOpen(true);
          if (!e.target.value.trim()) {
            onChange("");
          }
        }}
        placeholder="Seleccione un usuario..."
        className="w-full bg-card border border-border rounded-lg px-4 py-3 pr-14 text-foreground
                   focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
      />

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
        aria-label="Mostrar campers"
      >
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute z-30 mt-2 max-h-64 w-full overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => {
                  onChange(user.id);
                  setSearch(user.displayName);
                  setIsOpen(false);
                }}
                className={`block w-full px-4 py-3 text-left text-sm transition-colors hover:bg-muted ${
                  user.id === value ? "bg-muted text-foreground" : "text-foreground"
                }`}
              >
                <span className="font-medium">{user.displayName}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {getAgeLabel(user.ageCategory)}
                </span>
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              No se encontraron campers
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserSelector;
