
/**
 * Servicio para integrar ZapSign.
 * Permite subir documentos y obtener enlaces de administración para firma manual.
 */

const API_TOKEN = import.meta.env.VITE_ZAPSIGN_API_TOKEN;
// Cambiamos URL para usar el proxy de Vite y evitar CORS
const API_URL = '/zapsign-api/v1/docs/';

/**
 * Convierte un Blob a una cadena Base64 sin el prefijo del tipo de datos.
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            // Quitamos el prefijo 'data:application/pdf;base64,' o similares
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

/**
 * Sube un documento a ZapSign y devuelve la URL de administración o el token del documento.
 */
export const uploadToZapSign = async (blob: Blob, fileName: string) => {
    try {
        if (!API_TOKEN) {
            throw new Error('API Token de ZapSign no configurado en el archivo .env');
        }

        const base64 = await blobToBase64(blob);

        const response = await fetch(`${API_URL}?api_token=${API_TOKEN}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: fileName,
                base64_docx: base64, // Usamos base64_docx para archivos de Word
                signers: [
                    {
                        name: "Firmante Externo"
                    }
                ]
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('ZapSign API Error Details:', errorData);
            throw new Error(`Error de ZapSign (${response.status}): ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        console.log('ZapSign Upload Success:', data);

        // ZapSign devuelve un 'token' que identifica al documento.
        // Como el usuario quiere terminarlo manualmente, podemos enviarlo a su dashboard 
        // o a una URL de administración si el API la proporciona.
        // En la mayoría de los casos, simplemente dirigirse a app.zapsign.com.br/docs/{token} funciona
        return `https://app.zapsign.com.br/documento/${data.token}`;
    } catch (error: any) {
        console.error('Error en uploadToZapSign:', error);
        throw error;
    }
};
