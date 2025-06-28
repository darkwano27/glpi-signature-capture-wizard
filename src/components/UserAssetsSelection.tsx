import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Monitor } from 'lucide-react';

interface UserAssetsSelectionProps {
  onUserSelect: (user: any) => void;
  onAssetsChange: (assets: any[]) => void;
}

const UserAssetsSelection = ({ onUserSelect, onAssetsChange }: UserAssetsSelectionProps) => {
  const [userOptions, setUserOptions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchTerm.length > 2) {
        fetchFilteredUsers(searchTerm);
      } else {
        setUserOptions([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const fetchFilteredUsers = async (query: string) => {
    const token = localStorage.getItem('auth_token');

    const response = await fetch(`http://localhost:3001/api/glpi/users?q=${encodeURIComponent(query)}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    setUserOptions(data);
  };

  const handleUserSelect = async (user: any) => {
    setSelectedUser(user);
    setSearchTerm(user.name);
    setUserOptions([]);
    onUserSelect(user);

    if (user) {
      setIsLoadingAssets(true);
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`/api/glpi/user-assets/${user.id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
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
        {/* User Search Input */}
        <div>
          <label className="block text-sm font-medium mb-2">Buscar Usuario</label>
          <input
            type="text"
            placeholder="Escribe el nombre del usuario..."
            className="w-full p-2 border rounded"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {userOptions.length > 0 && (
            <ul className="border rounded mt-1 max-h-40 overflow-y-auto">
              {userOptions.map((user) => (
                <li
                  key={user.id}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleUserSelect(user)}
                >
                  <div>{user.name}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                  {user.code && (
                  <div className="text-xs text-blue-500">Código: {user.code}</div>
            )}
                </li>
              ))}
            </ul>
          )}
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
                            asset.states_id === 1
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
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
