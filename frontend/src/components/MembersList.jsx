const MembersList = ({ roomId, members, isAdmin, currentUserId, onRemoveMember, onInviteMembers }) => {
  if (!roomId) return null;

  const onlineMembers = members.filter((m) => m.status === "online");
  const offlineMembers = members.filter((m) => m.status !== "online");

  return (
    <div className="bg-white border-start d-flex flex-column" style={{ width: "240px", height: "100vh" }}>
      {/* Header */}
      <div className="p-3 border-bottom">
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="fw-semibold mb-0 d-flex align-items-center gap-2">
            <span>👥</span>
            Members ({members.length})
          </h6>
          {isAdmin && (
            <button
              className="btn btn-sm btn-primary py-0 px-2"
              onClick={onInviteMembers}
              title="Invite members"
            >
              +
            </button>
          )}
        </div>
      </div>

      {/* Members List */}
      <div className="flex-grow-1 overflow-auto p-3">
        {onlineMembers.length > 0 && (
          <div className="mb-4">
            <p className="text-muted small mb-2">ONLINE — {onlineMembers.length}</p>
            <div className="d-flex flex-column gap-2">
              {onlineMembers.map((member) => (
                <div key={member.user_id} className="d-flex align-items-center gap-2 p-2 rounded bg-light position-relative">
                  <div className="position-relative">
                    <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: "32px", height: "32px", fontSize: "0.75rem" }}>
                      {member.display_name[0].toUpperCase()}
                    </div>
                    <span className="position-absolute bg-success rounded-circle" style={{ width: "10px", height: "10px", bottom: "-2px", right: "-2px", border: "2px solid white" }}></span>
                  </div>
                  <div className="flex-grow-1 text-truncate">
                    <p className="mb-0 small fw-medium text-truncate">
                      {member.display_name}
                      {member.user_id === currentUserId && <span className="text-muted"> (You)</span>}
                    </p>
                    {member.role === "admin" && (
                      <p className="mb-0 text-warning" style={{ fontSize: "0.7rem" }}>👑 Admin</p>
                    )}
                  </div>
                  {isAdmin && member.user_id !== currentUserId && member.role !== "admin" && (
                    <button
                      className="btn btn-sm btn-outline-danger py-0 px-1"
                      onClick={() => onRemoveMember(roomId, member.user_id)}
                      title="Remove member"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {offlineMembers.length > 0 && (
          <div>
            <p className="text-muted small mb-2">OFFLINE — {offlineMembers.length}</p>
            <div className="d-flex flex-column gap-2">
              {offlineMembers.map((member) => (
                <div key={member.user_id} className="d-flex align-items-center gap-2 p-2 rounded opacity-50 position-relative">
                  <div className="bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: "32px", height: "32px", fontSize: "0.75rem" }}>
                    {member.display_name[0].toUpperCase()}
                  </div>
                  <div className="flex-grow-1 text-truncate">
                    <p className="mb-0 small fw-medium text-truncate">
                      {member.display_name}
                      {member.user_id === currentUserId && <span className="text-muted"> (You)</span>}
                    </p>
                    {member.role === "admin" && (
                      <p className="mb-0 text-warning" style={{ fontSize: "0.7rem" }}>👑 Admin</p>
                    )}
                  </div>
                  {isAdmin && member.user_id !== currentUserId && member.role !== "admin" && (
                    <button
                      className="btn btn-sm btn-outline-danger py-0 px-1"
                      onClick={() => onRemoveMember(roomId, member.user_id)}
                      title="Remove member"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MembersList;