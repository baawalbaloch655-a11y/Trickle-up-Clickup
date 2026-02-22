import { Plus, Search, Filter, MoreHorizontal, User as UserIcon } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { employeesApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useEffect, useState } from 'react';
import { getSocket } from '../../lib/socket';
import InviteEmployeeModal from './InviteEmployeeModal';

export default function PeoplePage() {
    const { activeOrg } = useAuthStore();
    const qc = useQueryClient();
    const [search, setSearch] = useState('');
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

    const { data: employeesData, isLoading } = useQuery({
        queryKey: ['employees', activeOrg?.id],
        queryFn: () => employeesApi.getAll(activeOrg!.id).then(r => r.data.data),
        enabled: !!activeOrg,
    });

    useEffect(() => {
        if (!activeOrg) return;
        const socket = getSocket();

        const handleUpdate = (event: any) => {
            // Optimistic update of the employee list
            if (event.employeeId) {
                qc.invalidateQueries({ queryKey: ['employees', activeOrg.id] });
            }
        };

        socket.on('employee.updated', handleUpdate);
        socket.on('employee.status_changed', handleUpdate);
        socket.on('employee.capacity_updated', handleUpdate);

        return () => {
            socket.off('employee.updated', handleUpdate);
            socket.off('employee.status_changed', handleUpdate);
            socket.off('employee.capacity_updated', handleUpdate);
        };
    }, [activeOrg, qc]);

    const employees = employeesData || [];
    const filteredEmployees = employees.filter((emp: any) =>
        emp.user.name.toLowerCase().includes(search.toLowerCase()) ||
        emp.user.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col pt-4">
            <header className="px-8 pb-6 flex items-center justify-between flex-shrink-0">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        Organization Directory
                    </h1>
                    <p className="text-gray-400 mt-1">Manage employees, departments, and roles.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="btn-secondary flex items-center gap-2">
                        <Filter size={16} /> Filters
                    </button>
                    <button className="btn-primary flex items-center gap-2" onClick={() => setIsInviteModalOpen(true)}>
                        <Plus size={16} /> Invite Employee
                    </button>
                </div>
            </header>

            <div className="px-8 flex-1 flex flex-col min-h-0">
                <div className="mb-4">
                    <div className="relative max-w-sm">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Find by name or email..."
                            className="input pl-10"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-800 bg-gray-800/50">
                                    <th className="py-3 px-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Employee</th>
                                    <th className="py-3 px-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Role</th>
                                    <th className="py-3 px-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Department</th>
                                    <th className="py-3 px-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Status</th>
                                    <th className="py-3 px-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Capacity</th>
                                    <th className="py-3 px-4 font-semibold text-gray-400 text-xs uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/50">
                                {isLoading ? (
                                    <tr><td colSpan={6} className="text-center py-8 text-gray-500">Loading directory...</td></tr>
                                ) : filteredEmployees.map((emp: any) => (
                                    <tr key={emp.id} className="hover:bg-gray-800/30 transition-colors group cursor-pointer">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                {emp.user.avatarUrl ? (
                                                    <img src={emp.user.avatarUrl} alt="" className="w-8 h-8 rounded-full bg-gray-800" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                                                        <UserIcon size={14} className="text-gray-400" />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-medium text-gray-200">{emp.user.name}</div>
                                                    <div className="text-xs text-gray-500">{emp.title || emp.user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-400 font-medium">
                                            {emp.role?.name || 'Standard'}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-400">
                                            {emp.department?.name || <span className="text-gray-600 italic">None</span>}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${emp.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500' :
                                                emp.status === 'ON_LEAVE' ? 'bg-orange-500/10 text-orange-500' :
                                                    'bg-gray-800 text-gray-500'
                                                }`}>
                                                {emp.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-400">
                                            {Math.round(emp.capacityMins / 60)}h / wk
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <button className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-all">
                                                <MoreHorizontal size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <InviteEmployeeModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
            />
        </div>
    );
}
