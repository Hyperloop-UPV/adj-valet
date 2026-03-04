import { TriangleAlert } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import logo from '../assets/logo.svg';

interface Props {
    adjPath: string | null;
    error: string | null;
    isLoading: boolean;
    pathInput: string;
    setPathInput: (value: string) => void;
    canBrowseDirectories: boolean;
    onBrowseDirectory: () => void | Promise<void>;
    onLoadConfig: () => void;
    onReset: () => void;
    onLoadDemo: () => void;
}

export const SetupScreen = ({
    adjPath,
    error,
    isLoading,
    pathInput,
    setPathInput,
    canBrowseDirectories,
    onBrowseDirectory,
    onLoadConfig,
    onReset,
    onLoadDemo,
}: Props) => {
    return (
        <div className="flex min-h-full w-full items-center justify-center px-6 py-10">
            <Card className="w-full max-w-5xl overflow-hidden">
                <div className="grid gap-0 md:grid-cols-2">
                    <div className="flex flex-col justify-between gap-8 bg-[radial-gradient(circle_at_top,_#fff7ed,_#ffe9d6_55%,_#f6f5f1_100%)] p-8">
                        <div className="flex items-center gap-3">
                            <img src={logo} alt="ADJ Valet" className="h-12 w-12" />
                            <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                                    ADJ Valet
                                </p>
                                <h1 className="text-2xl font-semibold">
                                    Configuration Console
                                </h1>
                            </div>
                        </div>
                        <div className="space-y-4 text-sm text-muted-foreground">
                            <p>
                                Connect to your ADJ directory to manage boards,
                                telemetry, and packet routing with real-time
                                sync.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="secondary">Board Editor</Badge>
                                <Badge variant="secondary">
                                    Packet Designer
                                </Badge>
                                <Badge variant="secondary">
                                    Socket Mapping
                                </Badge>
                            </div>
                        </div>
                        <div className="rounded-xl border border-border bg-card/80 p-4 text-xs text-muted-foreground">
                            <p className="font-semibold text-foreground">Tip</p>
                            <p className="mt-1">
                                Use the same ADJ directory across sessions. We
                                cache the last path locally for quick reconnects.
                            </p>
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="space-y-2">
                            <h2 className="text-xl font-semibold">
                                Connect to ADJ
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {adjPath && error
                                    ? 'The cached ADJ path is no longer valid. Choose a new directory:'
                                    : adjPath
                                      ? 'Failed to load configuration. Choose a different directory:'
                                      : canBrowseDirectories
                                        ? 'Choose your ADJ directory to get started.'
                                        : 'Enter the path to your ADJ directory to get started.'}
                            </p>
                        </div>

                        {adjPath && (
                            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                                <div className="flex items-center gap-2">
                                    <TriangleAlert className="h-4 w-4" />
                                    <span className="font-medium">
                                        {error
                                            ? 'Invalid cached path'
                                            : 'Previous path'}
                                    </span>
                                </div>
                                <code className="mt-2 block rounded bg-amber-100 px-2 py-1 text-xs">
                                    {adjPath}
                                </code>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            setPathInput(adjPath)
                                        }
                                    >
                                        Use this path
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={onReset}
                                    >
                                        Clear cached path
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="mt-6 space-y-4">
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <Input
                                    className="flex-1"
                                    placeholder="Enter ADJ directory path..."
                                    value={pathInput}
                                    onChange={(e) =>
                                        setPathInput(e.target.value)
                                    }
                                    onKeyDown={(e) =>
                                        e.key === 'Enter' && onLoadConfig()
                                    }
                                    disabled={isLoading}
                                />
                                {canBrowseDirectories && (
                                    <Button
                                        variant="outline"
                                        onClick={onBrowseDirectory}
                                        disabled={isLoading}
                                    >
                                        Browse...
                                    </Button>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    className="flex-1 min-w-[200px]"
                                    onClick={onLoadConfig}
                                    disabled={isLoading || !pathInput.trim()}
                                >
                                    {isLoading
                                        ? 'Connecting...'
                                        : 'Load Configuration'}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={onReset}
                                    disabled={isLoading}
                                >
                                    Clear Cache
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={onLoadDemo}
                                    disabled={isLoading}
                                >
                                    Enter Demo Mode
                                </Button>
                            </div>
                        </div>

                        {isLoading && (
                            <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                                <LoadingSpinner />
                                Loading ADJ configuration...
                            </div>
                        )}

                        {error && (
                            <Card className="mt-6 border-destructive/30 bg-destructive/5">
                                <CardContent className="flex gap-3 p-4 text-sm">
                                    <TriangleAlert className="mt-0.5 h-4 w-4 text-destructive" />
                                    <div>
                                        <p className="font-semibold text-destructive">
                                            Error
                                        </p>
                                        <p className="text-muted-foreground">
                                            {error}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
};
