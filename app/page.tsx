"use client"

import { PATIENT_ID } from "./constants"

export default function Home() {
  return (
    <div className="flex mt-20 justify-center h-screen">
      <div className="flex flex-col gap-4 max-w-md">
        <div>
          Submission by team Brekky
        </div>
        Patient receives a unique URL to access their consultation
        <button className="btn btn-primary" onClick={() => {
          window.location.href = `/patient/${PATIENT_ID}`
        }}>Test for a valid patient</button>
        <button className="btn btn-primary" onClick={() => {
          window.location.href = `/patient/invalid`
        }}>Test for a invalid patient</button>
      </div>
    </div>
  )
}
