/**
 * SCHOLARIO-OS — Enterprise Policy Engine
 * Attribute-Based Policy Evaluation (ABAC) for complex operational business rules.
 */

export interface PolicyContext {
  userRole: string;
  userId: string;
  tenantId: string;
  currentTime?: Date;
  attributes?: Record<string, unknown>;
}

export interface PolicyEvaluationResult {
  isAllowed: boolean;
  reason?: string;
  code?: string;
}

export type PolicyEvaluator = (context: PolicyContext, resource: unknown) => PolicyEvaluationResult;

class PolicyEngine {
  private policies: Map<string, PolicyEvaluator> = new Map();

  constructor() {
    this.registerCorePolicies();
  }

  private registerCorePolicies(): void {
    // Policy: Fee Discount Cap Rule
    this.policies.set('POLICY_FEE_MAX_DISCOUNT', (ctx, resource) => {
      const discountPercentage = (resource as { discountPercentage?: number })?.discountPercentage || 0;
      if (ctx.userRole === 'SUPER_ADMIN') return { isAllowed: true };
      if (ctx.userRole === 'PRINCIPAL' && discountPercentage <= 25) {
        return { isAllowed: true };
      }
      if (discountPercentage > 25) {
        return {
          isAllowed: false,
          code: 'ERR_POLICY_DISCOUNT_EXCEEDED',
          reason: 'Discounts above 25% require Super Admin approval.',
        };
      }
      return { isAllowed: true };
    });

    // Policy: Attendance Lock Window
    this.policies.set('POLICY_ATTENDANCE_TIME_WINDOW', (ctx) => {
      if (ctx.userRole === 'SUPER_ADMIN' || ctx.userRole === 'PRINCIPAL') {
        return { isAllowed: true };
      }
      const hour = (ctx.currentTime || new Date()).getHours();
      // Teachers can edit attendance between 7 AM and 8 PM
      if (hour >= 7 && hour <= 20) {
        return { isAllowed: true };
      }
      return {
        isAllowed: false,
        code: 'ERR_POLICY_ATTENDANCE_LOCKED',
        reason: 'Daily attendance editing is locked outside of school operating hours (7 AM - 8 PM).',
      };
    });
  }

  public registerPolicy(id: string, evaluator: PolicyEvaluator): void {
    this.policies.set(id, evaluator);
  }

  public evaluate(policyId: string, context: PolicyContext, resource?: unknown): PolicyEvaluationResult {
    const evaluator = this.policies.get(policyId);
    if (!evaluator) {
      return { isAllowed: true }; // Default permit if policy not registered
    }
    return evaluator(context, resource);
  }
}

export const policyEngine = new PolicyEngine();
