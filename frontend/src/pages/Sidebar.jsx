import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, LogOut, Hash } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CreateRoomDialog from "./CreateRoomDialog";

const Sidebar = ({ selectedRoomId, onRoomSelect, userId }) => {
  const [rooms, setRooms] = useState([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Dummy static room list (replace later with API call if needed)
    const sampleRooms = [
      { id: "1", name: "Web Dev", description: "Frontend discussions" },
      { id: "2", name: "AI Study Group", description: "ML & AI learning" },
      { id: "3", name: "DBMS Revision", description: "Database topics" },
    ];
    setRooms(sampleRooms);
  }, []);

  const handleSignOut = () => {
    navigate("/auth");
  };

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-screen">
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-lg font-bold text-white flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Hash className="w-5 h-5 text-white" />
          </div>
          Study Rooms
        </h1>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => onRoomSelect(room.id)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                selectedRoomId === room.id
                  ? "bg-purple-600 text-white"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              <Hash
                className={`w-4 h-4 ${
                  selectedRoomId === room.id
                    ? "text-white"
                    : "text-gray-400"
                }`}
              />
              <span className="truncate">{room.name}</span>
            </button>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-gray-800 space-y-2">
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Room
        </Button>
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
          size="sm"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>

      {/* Dummy dialog (can replace later with actual modal) */}
      {createDialogOpen && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-gray-800 text-white p-4 rounded-lg shadow-lg w-56">
          <p className="mb-2">Create a new study room</p>
          <input
            type="text"
            placeholder="Room Name"
            className="w-full p-2 mb-2 bg-gray-700 rounded"
          />
          <Button
            onClick={() => setCreateDialogOpen(false)}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            Create
          </Button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
