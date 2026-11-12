import { PipelineStage } from 'mongoose';
import { today } from './dateUtils';

// One definition of a vacation's status, used by the vacations page, the filters AND the MCP tools,
// so "active now" always means the same thing everywhere:
//   ended    → the end date is before today
//   upcoming → the start date is after today
//   active   → everything else (started and not ended)
export function statusStage(): PipelineStage.AddFields {
    const todayDate = today();

    return {
        $addFields: {
            status: {
                $switch: {
                    branches: [
                        { case: { $lt: ['$endDate', todayDate] }, then: 'ended' },
                        { case: { $gt: ['$startDate', todayDate] }, then: 'upcoming' }
                    ],
                    default: 'active'
                }
            }
        }
    };
}
