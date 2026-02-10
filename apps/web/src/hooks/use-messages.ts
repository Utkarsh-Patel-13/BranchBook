import { useQuery } from "@tanstack/react-query";
import { trpc } from "../utils/trpc";

export const useListMessages = (nodeId: string) => {
	return useQuery({
		...trpc.message.list.queryOptions({ nodeId }),
	});
};
