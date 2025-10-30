"use client";

import React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { createFragment, getUserFragments } from "@/services/api";
import { getUser, FormattedUser } from "@/services/auth";

export default function Info() {
  const [loading, setLoading] = useState(false);
  const [fragment, setFragment] = useState("");
  const [user, setUser] = useState<FormattedUser | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await getUser();
        setUser(currentUser);
      } catch (err) {
        console.error("Failed to load user:", err);
      }
    }
    loadUser();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!user) {
      alert("Please log in to create fragments");
      return;
    }

    setLoading(true);

    try {
      // Use the proper API service function with authenticated user
      await createFragment(user, fragment);
      router.push("/");
    } catch (err) {
      console.error("Error creating fragment:", err);
      alert("Failed to add fragment");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="  mx-auto bg-gray-300">
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardHeader>
            <CardTitle>Add a Data</CardTitle>
            <CardDescription>
              Enter your fragment below and submit to save it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Textarea
                value={fragment}
                onChange={(e) => setFragment(e.target.value)}
                placeholder="Type your fragment here..."
                required
              />
              <Button type="submit" size="sm" disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
