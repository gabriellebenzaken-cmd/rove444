import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, Users, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import CreateGroupDialog from "../components/groups/CreateGroupDialog";

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const me = await base44.auth.me();
    setUser(me);
    const allGroups = await base44.entities.Group.list("-created_date", 50);
    const myGroups = allGroups.filter(
      (g) => g.member_emails?.includes(me.email) || g.admin_email === me.email
    );
    setGroups(myGroups);
    setLoading(false);
  }

  return (
    <div className="px-5 pt-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[28px] font-bold tracking-tight leading-none">Groups</h1>
        <Button size="sm" onClick={() => setShowCreate(true)} className="rounded-full px-4 h-8 text-xs font-semibold shadow-sm">
          <Plus className="h-3.5 w-3.5 mr-1" /> New Group
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-semibold text-lg mb-1">no groups yet</h3>
          <p className="text-muted-foreground text-sm mb-6">create a group to plan trips together</p>
          <Button onClick={() => setShowCreate(true)} className="rounded-full px-6">
            Create Group
          </Button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {groups.map((group) => (
            <Link key={group.id} to={`/group/${group.id}`} className="block active:scale-[0.98] transition-transform duration-150">
              <div className="bg-white rounded-[18px] p-4 shadow-[0_2px_10px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)] transition-shadow duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-accent flex items-center justify-center">
                      <Users className="h-4.5 w-4.5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{group.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {group.member_emails?.length || 1} members
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreateGroupDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        user={user}
        onCreated={loadData}
      />
    </div>
  );
}