import IColumn from "../../interfaces/Column";

export const getColumns = async (board_id: string): Promise<IColumn[]> => {
    try {
        const token = localStorage.getItem('jwt');
        const response = await fetch(`/api/column?board_id=${board_id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error("Failed to fetch data: " + data.error);
        }
        
        const data:IColumn[] = await response.json();
        return data;
    } catch (error) {
        console.error('Failed to fetch columns:', error);
        return [];
    }
}
