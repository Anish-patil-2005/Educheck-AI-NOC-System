import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { FileSearch, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <Card className="w-full max-w-lg text-center shadow-lg border-0">
                <CardContent className="p-8 md:p-12">
                    <div className="relative flex justify-center items-center mb-6">
                        <FileSearch className="w-32 h-32 text-blue-100" strokeWidth={1} />
                        <h1 className="absolute text-8xl font-bold text-blue-600 opacity-80">
                            404
                        </h1>
                    </div>

                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mt-4">
                        Page Not Found
                    </h2>

                    <p className="mt-3 text-gray-600">
                        We're sorry, but the page you were looking for doesn't seem to exist.
                        It might have been moved, deleted, or you may have mistyped the URL.
                    </p>

                    <div className="mt-8">
                        <Button asChild className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white">
                            <Link to="/dashboard">
                                <Home className="w-4 h-4 mr-2" />
                                Go Back to Dashboard
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
