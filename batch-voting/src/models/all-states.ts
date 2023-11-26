/**
 * Possible states and their descriptions
 * 
 * Usage:
 * 
 *  // test valid state
 *  if (CLAIM_STATES.includes(state) {
 *    // is a valid state
 *  })
 */
export {
  ALL_STATES,
  COMMUNITY_STATES,
  CLAIM_STATES,
  PERSON_STATES,
  ELECTOR_STATES,
  PLAN_STATES,
  TASK_STATES,
  TRANSACTION_STATES
}

export const 
  NONE =  0,
  DRAFT =  1,   
  CANCELED = 2,   
  REVISION = 3,    
  CLAIMED =  4,   
  VOTING =  6,
  ASSIGNED = 7,
  ACTIVE =  8,
  WAITING = 9,
  DONE =  10,
  IGNORED = 11, // will not do this 
  UNPAID = 12, // payment transaction failed and needs repayment !
  FAILED = 13, 
  REJECTED = 19,   
  APPROVED = 20
;

const ALL_STATES = {
  0: "NONE",
  1: "DRAFT",   
  2: "CANCELED",   
  3: "REVISION",    
  4: "CLAIMED",   
  6: "VOTING",
  7: "ASSIGNED",
  8: "ACTIVE",
  9: "WAITING",
  10: "DONE",
  11: "IGNORED", // will not do this 
  12: "UNPAID", // payment transaction failed, reamins unpaid
  13: "FAILED",
  19: "REJECTED",   
  20: "APPROVED",
  1001: "POSITIVE",
  1002: "NEGATIVE",
  1003: "ABSTAIN",
}

const COMMUNITY_STATES = [1,2,3,19,20]; // DRAFT,CANCELED,REVISION,REJECTED.APPROVED

const CLAIM_STATES = [1,2,9,4,12,6,19,20]; // DRAFT,CANCELED,WAITING,CLAIMED,UNPAID,VOTING,REJECTED,APPROVED

const PERSON_STATES = [1,2,19,20]; // DRAFT,CANCELED,REJECTED,APPROVED

const ELECTOR_STATES = [0,2,7,8,11]; // NONE,CANCELED,ASSIGNED,DONE,IGNORED

const PLAN_STATES = [1,2,9,8,10]; // DRAFT,CANCELED,WAITING,ACTIVE,DONE

const TASK_STATES = [2,7,10,11]; // CANCELED,ASSIGNED,DONE,IGNORED

const TRANSACTION_STATES = [9,10,11,13]; // 9: "WAITING", 10: "DONE", 11: "IGNORED" 13: "FAILED"