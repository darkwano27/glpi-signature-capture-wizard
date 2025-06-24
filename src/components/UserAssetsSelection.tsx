
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Monitor } from 'lucide-react';

interface UserAssetsSelectionProps {
  onUserSelect: (user: any) => void;
  onAssetsChange: (assets: any[]) => void;
}

const UserAssetsSelection = ({ onUserSelect, onAssetsChange }: UserAssetsSelectionProps) => {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await fetch('/api/glpi/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleUserSelect = async (userId: string) => {
    const user = users.find(u => u.id === parseInt(userId));
    setSelectedUser(user);
    onUserSelect(user);

    if (user) {
      setIsLoadingAssets(true);
      try {
        const response = await fetch(`/api/glpi/user-assets/${user.id}`);
        const data = await response.json();
        setAssets(data);
        onAssetsChange(data);
      } catch (error) {
        console.error('Error loading user assets:', error);
      } finally {
        setIsLoadingAssets(false);
      }
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-green-600" />
          Selección de Usuario y Activos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* User Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Seleccionar Usuario</label>
          <Select onValueChange={handleUserSelect} disabled={isLoadingUsers}>
            <SelectTrigger>
              <SelectValue placeholder={isLoadingUsers ? "Cargando usuarios..." : "Elige un usuario"} />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id.toString()}>
                  {user.name} - {user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Assets Table */}
        {selectedUser && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Monitor className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Activos Asignados</h3>
            </div>
            
            {isLoadingAssets ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : assets.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Nombre del Activo</TableHead>
                      <TableHead>Número de Serie</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assets.map((asset) => (
                      <TableRow key={asset.id}>
                        <TableCell className="font-medium">{asset.id}</TableCell>
                        <TableCell>{asset.name}</TableCell>
                        <TableCell>{asset.otherserial || 'N/A'}</TableCell>
                        <TableCell>{asset.type}</TableCell>
                        <TableCell>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            asset.states_id === 1 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {asset.state}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Monitor className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No se encontraron activos asignados a este usuario</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserAssetsSelection;
