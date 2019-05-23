export interface RemoteData<T>
{
    status: "pending" | "error" | "complete";
    result: T;
    isComplete: boolean;
    isPending: boolean;
    isError: boolean;
}
