import Link from "next/link";

export default function ApplyPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900" style={{ fontFamily: "var(--font-logo)" }}>
          NELU ADVENTURES
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Career Opportunities
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          <div className="rounded-md bg-yellow-50 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Invalid or Expired Link
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    The application link you clicked is either invalid or has expired. 
                    Please make sure you copied the full link from the email.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-gray-500 mb-6">
            If you believe this is an error, please contact HR at operations.neluadventures@gmail.com
          </p>

          <Link href="/" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--primary-orange)] hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">
            Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
