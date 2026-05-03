'use client';
import { useState, useEffect } from 'react';
import { BedDouble, Users, CheckCircle, XCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { roomsApi } from '@/lib/api';
import { useProtectedFetch } from '@/hooks/useProtectedFetch';

export default function RoomsPage() {
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<any[]>([]);
  const [grouped, setGrouped] = useState<Record<string, Record<string, any[]>>>({});
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [allocating, setAllocating] = useState(false);

  useEffect(() => {
    roomsApi.getAvailableRooms()
      .then((res) => {
        setRooms(res.data?.data?.rooms || []);
        setGrouped(res.data?.data?.grouped || {});
      })
      .catch(() => toast.error('Failed to load rooms'))
      .finally(() => setLoading(false));
  }, []);

  const handleAllocate = async () => {
    if (!selectedRoom) return;
    setAllocating(true);
    try {
      await roomsApi.selfAllocate(Number(selectedRoom.id));
      toast.success(`Room ${selectedRoom.room_number} allocated successfully!`);
      setSelectedRoom(null);
      // Refresh
      const res = await roomsApi.getAvailableRooms();
      setRooms(res.data?.data?.rooms || []);
      setGrouped(res.data?.data?.grouped || {});
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Allocation failed');
    } finally {
      setAllocating(false);
    }
  };

  const occupancyPct = (room: any) => Math.round((room.occupied_count / room.capacity) * 100);

  return (
    <DashboardLayout>
      <Toaster position="top-right" />
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Available Rooms</h2>
          <p className="text-sm text-slate-500">Rooms matching your department, semester and gender</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-40 rounded-2xl" />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <Card className="py-16 text-center">
            <BedDouble className="mx-auto mb-3 h-12 w-12 text-slate-300" />
            <p className="text-slate-500">No available rooms found for your profile</p>
          </Card>
        ) : (
          Object.entries(grouped).map(([block, floors]) => (
            <div key={block}>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
                Block {block}
              </h3>
              {Object.entries(floors).map(([floor, floorRooms]) => (
                <div key={floor} className="mb-4">
                  <p className="mb-2 text-xs text-slate-400">Floor {floor}</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {(floorRooms as any[]).map((room) => (
                      <Card
                        key={room.id}
                        hover
                        onClick={() => setSelectedRoom(room)}
                        className="cursor-pointer border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
                              Room {room.room_number}
                            </p>
                            <p className="text-xs text-slate-400">{room.hostel?.hostel_name}</p>
                          </div>
                          <Badge variant={room.available ? 'success' : 'danger'}>
                            {room.available ? 'Available' : 'Full'}
                          </Badge>
                        </div>

                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {room.occupied_count}/{room.capacity} occupied
                            </span>
                            <span>{occupancyPct(room)}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-700">
                            <div
                              className={`h-1.5 rounded-full transition-all ${
                                occupancyPct(room) >= 100 ? 'bg-red-500' :
                                occupancyPct(room) >= 75 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(occupancyPct(room), 100)}%` }}
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Confirm Modal */}
      <Modal
        open={!!selectedRoom}
        onClose={() => setSelectedRoom(null)}
        title="Confirm Room Allocation"
        size="sm"
      >
        {selectedRoom && (
          <div className="space-y-4">
            <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-4 space-y-2">
              {[
                ['Room', selectedRoom.room_number],
                ['Block', selectedRoom.block_name],
                ['Floor', selectedRoom.floor_number],
                ['Hostel', selectedRoom.hostel?.hostel_name],
                ['Capacity', `${selectedRoom.occupied_count}/${selectedRoom.capacity}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-slate-500">{k}</span>
                  <span className="font-medium text-slate-800 dark:text-slate-100">{v}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400">Once allocated, you cannot change your room without admin approval.</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setSelectedRoom(null)}>
                Cancel
              </Button>
              <Button className="flex-1" loading={allocating} onClick={handleAllocate}>
                Confirm
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
