/**
 * SCHOLARIO-OS — Enterprise Declarative Workflow State Engine
 * Orchestrates multi-stage approvals, state transitions, and step guards across modules.
 */

export type WorkflowState = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'DISPATCHED' | 'COMPLETED';

export interface WorkflowStep {
  id: string;
  name: string;
  allowedRoles: string[];
  nextStateOnApprove: WorkflowState;
  nextStateOnReject: WorkflowState;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  entityType: string;
  initialState: WorkflowState;
  steps: Record<WorkflowState, WorkflowStep>;
}

class WorkflowEngine {
  private workflows: Map<string, WorkflowDefinition> = new Map();

  constructor() {
    this.registerCoreWorkflows();
  }

  private registerCoreWorkflows(): void {
    const admissionWorkflow: WorkflowDefinition = {
      id: 'wf_admission_approval',
      name: 'Student Admission Approval Workflow',
      entityType: 'AdmissionApplication',
      initialState: 'DRAFT',
      steps: {
        DRAFT: {
          id: 'step_submit',
          name: 'Submit Application',
          allowedRoles: ['SUPER_ADMIN', 'PRINCIPAL', 'TEACHER'],
          nextStateOnApprove: 'PENDING_REVIEW',
          nextStateOnReject: 'REJECTED',
        },
        PENDING_REVIEW: {
          id: 'step_principal_review',
          name: 'Principal Review & Decision',
          allowedRoles: ['SUPER_ADMIN', 'PRINCIPAL'],
          nextStateOnApprove: 'APPROVED',
          nextStateOnReject: 'REJECTED',
        },
        APPROVED: {
          id: 'step_dispatch',
          name: 'Dispatch Official Admission Letter',
          allowedRoles: ['SUPER_ADMIN', 'PRINCIPAL'],
          nextStateOnApprove: 'DISPATCHED',
          nextStateOnReject: 'REJECTED',
        },
        DISPATCHED: {
          id: 'step_complete',
          name: 'Fee Receipt & Final Enrollment',
          allowedRoles: ['SUPER_ADMIN', 'PRINCIPAL'],
          nextStateOnApprove: 'COMPLETED',
          nextStateOnReject: 'REJECTED',
        },
        REJECTED: {
          id: 'step_rejected',
          name: 'Application Rejected',
          allowedRoles: [],
          nextStateOnApprove: 'REJECTED',
          nextStateOnReject: 'REJECTED',
        },
        COMPLETED: {
          id: 'step_completed',
          name: 'Enrollment Completed',
          allowedRoles: [],
          nextStateOnApprove: 'COMPLETED',
          nextStateOnReject: 'COMPLETED',
        },
      },
    };

    this.workflows.set(admissionWorkflow.id, admissionWorkflow);
  }

  public registerWorkflow(workflow: WorkflowDefinition): void {
    this.workflows.set(workflow.id, workflow);
  }

  public getWorkflow(id: string): WorkflowDefinition | undefined {
    return this.workflows.get(id);
  }

  public canTransition(
    workflowId: string,
    currentState: WorkflowState,
    role: string,
    approve: boolean
  ): { canTransition: boolean; nextState?: WorkflowState; reason?: string } {
    const wf = this.workflows.get(workflowId);
    if (!wf) return { canTransition: false, reason: 'Workflow definition not found' };

    const step = wf.steps[currentState];
    if (!step) return { canTransition: false, reason: 'Current workflow step not defined' };

    if (!step.allowedRoles.includes(role) && role !== 'SUPER_ADMIN') {
      return { canTransition: false, reason: `Role '${role}' is not authorized to advance this workflow stage` };
    }

    const nextState = approve ? step.nextStateOnApprove : step.nextStateOnReject;
    return { canTransition: true, nextState };
  }
}

export const workflowEngine = new WorkflowEngine();
