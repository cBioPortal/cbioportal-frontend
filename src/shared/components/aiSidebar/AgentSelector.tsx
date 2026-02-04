import * as React from 'react';
import { observer } from 'mobx-react';
import autobind from 'autobind-decorator';
import { Agent } from './AiSidebarStore';
import './aiSidebar.scss';

interface IAgentSelectorProps {
    agents: Agent[];
    selectedAgentId: string | null;
    onAgentChange: (agentId: string) => void;
    disabled?: boolean;
}

@observer
export class AgentSelector extends React.Component<IAgentSelectorProps, {}> {
    @autobind
    handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
        this.props.onAgentChange(event.target.value);
    }

    render() {
        const { agents, selectedAgentId, disabled } = this.props;

        if (agents.length === 0) {
            return (
                <div className="agent-selector">
                    <select
                        className="agent-dropdown"
                        disabled={true}
                        title="Loading agents..."
                    >
                        <option>Loading agents...</option>
                    </select>
                </div>
            );
        }

        return (
            <div className="agent-selector">
                <select
                    className="agent-dropdown"
                    value={selectedAgentId || ''}
                    onChange={this.handleChange}
                    disabled={disabled}
                    title="Select AI agent"
                >
                    {agents.map(agent => (
                        <option key={agent.id} value={agent.id}>
                            {agent.name}
                        </option>
                    ))}
                </select>
            </div>
        );
    }
}
