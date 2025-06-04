"use client"

import OfferTemplatesList from "@/components/offer-templates-list"
import { Topbar } from "@/components/topbar"

export default function Page() {
  return (
    <div className="w-full h-screen flex flex-col">
      <Topbar />
      <div className="flex-1 overflow-hidden">
        <OfferTemplatesList />
      </div>
    </div>
  )
}
