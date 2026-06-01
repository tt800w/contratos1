import { useState } from "react";
import { parseExcel, type CamperData } from "@/utils/excelParser";
import { getStudentAgeCategory } from "@/utils/studentUtils";
import { toast } from "sonner";

interface CamperUser {
  id: string;
  name: string;
  displayName: string;
  ageCategory: "menor" | "mayor" | "unknown";
  representative: {
    name: string;
    cedula: string;
    email: string;
    phone: string;
  };
  raw: CamperData;
}

export const useCamperData = () => {
  const [users, setUsers] = useState<CamperUser[]>([]);
  const [selectedUser, setSelectedUser] = useState("");

  const selectedUserData = users.find((u) => u.id === selectedUser);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseExcel(file);
      const mappedUsers = data.map((item, index) => {
        const ageCategory = getStudentAgeCategory(item);

        return {
          id: index.toString(),
          name: item.nombreCamper,
          displayName: item.nombreCamper,
          ageCategory,
          representative: {
            name: item.nombreRepresentante,
            cedula: item.cedulaRepresentante,
            email: item.emailRepresentante,
            phone: item.telefonoRepresentante,
          },
          raw: item,
        };
      });

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
    handleFileUpload,
  };
};
