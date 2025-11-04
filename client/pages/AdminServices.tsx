import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ServiceTable } from "@/components/ServiceTable";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminServices() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Page Header */}
      <section className="border-b border-border/40 py-8">
        <div className="container max-w-6xl mx-auto px-4">
          <Link to="/admin/orders">
            <Button variant="outline" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Services Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Create and manage services available in the marketplace
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="flex-1 py-8">
        <div className="container max-w-6xl mx-auto px-4">
          <ServiceTable />
        </div>
      </section>

      <Footer />
    </div>
  );
}
