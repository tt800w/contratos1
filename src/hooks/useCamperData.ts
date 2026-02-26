import { useState } from "react";
import { parseExcel } from "@/utils/excelParser";
import { toast } from "sonner";

export const useCamperData = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState("");

    const selectedUserData = users.find((u) => u.id === selectedUser);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const data = await parseExcel(file);
            const mappedUsers = data.map((item, index) => ({
                id: index.toString(),
                name: item.nombreCamper,
                representative: {
                    name: item.nombreRepresentante,
                    cedula: item.cedulaRepresentante,
                    email: item.emailRepresentante,
                    phone: "N/A"
                },
                raw: item
            }));

            setUsers(mappedUsers);
            toast.success(`Se cargaron ${mappedUsers.length} campers correctamente`);
        } catch (error) {
            console.error(error);
            toast.error("Error al procesar el archivo Excel");
        }
    };

    return {
        users,
        selectedUser,
        setSelectedUser,
        selectedUserData,
        handleFileUpload
    };
};
