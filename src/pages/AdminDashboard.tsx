import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Shield, User as UserIcon, Calendar, Edit2, Search } from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  role: string;
  createdAt?: string;
}

const AdminDashboard: React.FC = () => {
  const { user, role, loading } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [fetching, setFetching] = useState(true);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      if (role !== 'super_admin') return;

      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const usersList: UserData[] = [];
        querySnapshot.forEach((doc) => {
          usersList.push({ id: doc.id, ...doc.data() } as UserData);
        });
        setUsers(usersList);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setFetching(false);
      }
    };

    if (!loading) {
      fetchUsers();
    }
  }, [role, loading]);

  const handleRoleChange = async (userId: string, newRole: string) => {
      try {
          await updateDoc(doc(db, 'users', userId), { role: newRole });
          setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
          setEditingUserId(null);
      } catch (error) {
          console.error("Error updating role:", error);
      }
  };

  if (loading) return null; // Layout handles global loading usually, or we can just render nothing while waiting

  if (!user || role !== 'super_admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-6">
       {/* Header Section */}
      <div className="bg-dar-panel rounded-2xl p-6 border border-dar-border">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                User Management
            </h2>
            <div className="relative">
                <input
                    type="text"
                    placeholder="Search users..."
                    className="bg-dar-bg border border-dar-border rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                />
                <Search size={16} className="absolute left-3 top-2.5 text-gray-500" />
            </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-dar-panel rounded-2xl border border-dar-border overflow-hidden">
        {fetching ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-dar-border">
                <thead className="bg-dar-sidebar">
                    <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                        User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Joined Date
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Actions
                    </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-dar-border">
                    {users.map((userData) => (
                    <tr key={userData.id} className="hover:bg-dar-border/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-dar-active rounded-lg flex items-center justify-center">
                                <UserIcon className="h-5 w-5 text-primary" />
                            </div>
                            <div className="ml-4">
                            <div className="text-sm font-medium text-white">
                                {userData.email}
                            </div>
                            <div className="text-xs text-gray-500">ID: {userData.id}</div>
                            </div>
                        </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                        {editingUserId === userData.id && userData.email !== 'talelbenghorbel@gmail.com' ? (
                            <select
                                value={userData.role}
                                onChange={(e) => handleRoleChange(userData.id, e.target.value)}
                                className="text-sm rounded border-dar-border bg-dar-bg text-white focus:ring-primary focus:border-primary px-2 py-1"
                            >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                                <option value="super_admin">Super Admin</option>
                            </select>
                        ) : (
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                userData.role === 'super_admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50' :
                                userData.role === 'admin' ? 'bg-green-500/20 text-green-300 border border-green-500/50' :
                                'bg-gray-700/50 text-gray-300 border border-gray-600'
                            }`}>
                                {userData.role}
                            </span>
                        )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            <div className="flex items-center gap-2">
                                <Calendar size={14} />
                                {userData.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'}
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {userData.email !== 'talelbenghorbel@gmail.com' && (
                                <button
                                    onClick={() => setEditingUserId(userData.id === editingUserId ? null : userData.id)}
                                    className="text-gray-400 hover:text-primary transition-colors p-2 hover:bg-dar-active rounded-lg"
                                >
                                    <Edit2 size={16} />
                                </button>
                            )}
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
