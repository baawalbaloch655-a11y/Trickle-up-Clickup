import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalsApi } from '../../lib/api';
import { Layout, Plus, Target, CheckCircle2, MoreHorizontal, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';

export default function GoalsPage() {
    const queryClient = useQueryClient();
    const [isCreating, setIsCreating] = useState(false);
    const [newGoalName, setNewGoalName] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['goals'],
        queryFn: async () => {
            const res = await goalsApi.list();
            return res.data.data;
        }
    });

    const createGoal = useMutation({
        mutationFn: (name: string) => goalsApi.create({ name, color: '#22c55e' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['goals'] });
            setIsCreating(false);
            setNewGoalName('');
            toast.success('Goal created');
        }
    });

    const addTarget = useMutation({
        mutationFn: ({ goalId, name, targetValue, unit }: any) =>
            goalsApi.addTarget(goalId, { name, targetValue, unit, type: 'NUMBER' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['goals'] });
            toast.success('Target added');
        }
    });

    const updateTarget = useMutation({
        mutationFn: ({ goalId, targetId, currentValue }: any) =>
            goalsApi.updateTarget(goalId, targetId, { currentValue }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] })
    });

    const deleteGoal = useMutation({
        mutationFn: (id: string) => goalsApi.delete(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] })
    });

    return (
        <div className="flex-1 flex flex-col pt-16 bg-gray-50/50 min-h-screen">
            <div className="px-8 py-6 max-w-7xl mx-auto w-full">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Target className="text-green-500" size={28} />
                            Goals & OKRs
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">Track high-level objectives and measurable key results.</p>
                    </div>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus size={16} /> New Goal
                    </button>
                </div>

                {isCreating && (
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6 flex gap-4 items-center">
                        <input
                            autoFocus
                            type="text"
                            placeholder="e.g., Increase Q3 Revenue by 20%"
                            className="input flex-1"
                            value={newGoalName}
                            onChange={(e) => setNewGoalName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && newGoalName.trim() && createGoal.mutate(newGoalName)}
                        />
                        <button
                            className="btn-primary"
                            onClick={() => newGoalName.trim() && createGoal.mutate(newGoalName)}
                            disabled={createGoal.isPending || !newGoalName.trim()}
                        >
                            Create
                        </button>
                        <button className="btn-ghost" onClick={() => setIsCreating(false)}>Cancel</button>
                    </div>
                )}

                {isLoading ? (
                    <div className="flex justify-center p-12"><div className="w-8 h-8 rounded-full border-4 border-green-500 border-t-transparent animate-spin" /></div>
                ) : (
                    <div className="space-y-6">
                        {data?.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                                <Target size={48} className="mx-auto text-gray-300 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900">No Goals Yet</h3>
                                <p className="text-gray-500 mt-1">Set your first objective to align your team.</p>
                            </div>
                        ) : (
                            data?.map((goal: any) => (
                                <GoalCard
                                    key={goal.id}
                                    goal={goal}
                                    onAddTarget={addTarget.mutate}
                                    onUpdateTarget={updateTarget.mutate}
                                    onDelete={() => deleteGoal.mutate(goal.id)}
                                />
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function GoalCard({ goal, onAddTarget, onUpdateTarget, onDelete }: any) {
    const [isAddingTarget, setIsAddingTarget] = useState(false);
    const [targetName, setTargetName] = useState('');
    const [targetVal, setTargetVal] = useState('');

    // Compute total progress
    let totalProgress = 0;
    if (goal.targets?.length > 0) {
        const sum = goal.targets.reduce((acc: number, t: any) => {
            const p = Math.min(100, Math.max(0, (t.currentValue / (t.targetValue || 1)) * 100));
            return acc + p;
        }, 0);
        totalProgress = Math.round(sum / goal.targets.length);
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: goal.color }} />
                        <h2 className="text-xl font-bold text-gray-900">{goal.name}</h2>
                        <span className="text-sm font-medium text-gray-500">
                            {goal.isPrivate ? 'Private' : 'Public'}
                        </span>
                    </div>
                    {goal.description && <p className="text-gray-600 text-sm">{goal.description}</p>}

                    <div className="mt-4 flex items-center gap-4">
                        <div className="flex-1 max-w-md h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full transition-all duration-500"
                                style={{ backgroundColor: goal.color, width: `${totalProgress}%` }}
                            />
                        </div>
                        <span className="text-sm font-bold text-gray-700">{totalProgress}%</span>
                    </div>
                </div>

                <div className="flex gap-2 relative group">
                    <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            <div className="p-6 bg-gray-50/50">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Targets (Key Results)</h3>
                    <button
                        onClick={() => setIsAddingTarget(!isAddingTarget)}
                        className="text-sm text-green-600 font-medium hover:text-green-700 flex items-center gap-1"
                    >
                        <Plus size={14} /> Add Target
                    </button>
                </div>

                {isAddingTarget && (
                    <div className="flex gap-3 mb-4 p-3 bg-white border border-gray-200 rounded-lg">
                        <input
                            autoFocus
                            placeholder="Target name..."
                            className="input flex-1 text-sm h-9"
                            value={targetName}
                            onChange={(e) => setTargetName(e.target.value)}
                        />
                        <input
                            type="number"
                            placeholder="End Value"
                            className="input w-24 text-sm h-9"
                            value={targetVal}
                            onChange={(e) => setTargetVal(e.target.value)}
                        />
                        <button
                            className="btn-primary text-sm h-9 px-3"
                            onClick={() => {
                                if (targetName && targetVal) {
                                    onAddTarget({ goalId: goal.id, name: targetName, targetValue: Number(targetVal), unit: '' });
                                    setIsAddingTarget(false);
                                    setTargetName('');
                                    setTargetVal('');
                                }
                            }}
                        >Save</button>
                    </div>
                )}

                <div className="space-y-3">
                    {goal.targets?.length === 0 && !isAddingTarget && (
                        <p className="text-sm text-gray-500 italic">No targets defined.</p>
                    )}
                    {goal.targets?.map((target: any) => {
                        const prog = Math.min(100, Math.max(0, (target.currentValue / (target.targetValue || 1)) * 100));
                        return (
                            <div key={target.id} className="flex items-center gap-4 p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-gray-900">{target.name}</span>
                                        <span className="text-xs font-bold text-gray-500">
                                            {target.currentValue} / {target.targetValue} {target.unit} ({Math.round(prog)}%)
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 transition-all" style={{ width: `${prog}%` }} />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => onUpdateTarget({ goalId: goal.id, targetId: target.id, currentValue: Math.max(0, target.currentValue - 1) })}
                                        className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded text-gray-700 font-bold"
                                    >-</button>
                                    <button
                                        onClick={() => onUpdateTarget({ goalId: goal.id, targetId: target.id, currentValue: target.currentValue + 1 })}
                                        className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded text-gray-700 font-bold"
                                    >+</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
