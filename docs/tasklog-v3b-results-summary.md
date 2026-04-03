# Tasklog V3b Results Summary

This note is the canonical reader-facing summary for the completed `V3b` round.

For the fuller working artifact, see:

- [v3b-results-pack.md](/Users/Lab/Desktop/WebWay/workdocs/0tetbC-measure-tasklog-re-entry-value/v3b-results-pack.md)

## Status

- benchmark family: `Bench A`
- round: `V3b`
- status: complete
- required slots complete: `Yes`
- reps per slot: `3`
- slots:
  - `gpt-5.4`
  - `gpt-5.4-mini`
  - `claude-sonnet-4.6`

## Headline Result

Headline metric:

- `action_valid_success`
- paired difference measured as `Tasklog Re-entry - Normalized State`

| Model | Reps | Positive / Tie / Negative Reps | Normalized State | Tasklog Re-entry | Delta (points) | Relative Uplift | Paired Mean Diff | 95% CI |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `gpt-5.4` | 3 | 2 / 1 / 0 | 30.21% | 33.34% | +3.13 | +10.35% | +0.0313 | [-0.0104, 0.0833] |
| `gpt-5.4-mini` | 3 | 2 / 1 / 0 | 26.04% | 33.33% | +7.29 | +27.99% | +0.0729 | [0.0208, 0.1354] |
| `claude-sonnet-4.6` | 3 | 3 / 0 / 0 | 9.38% | 13.54% | +4.16 | +44.39% | +0.0417 | [0.0104, 0.0833] |
| `Overall` | 9 | 7 / 2 / 0 | 21.88% | 26.74% | +4.86 | +22.21% | +0.0486 | [0.0208, 0.0764] |

## Secondary Metrics

| Metric | Normalized State | Tasklog Re-entry | Delta (points) | Paired Mean Diff | 95% CI |
| --- | ---: | ---: | ---: | ---: | --- |
| `next_step_accuracy` | 50.00% | 61.46% | +11.46 | +0.1146 | [0.0590, 0.1736] |
| `strict_contract_accuracy` | 13.54% | 17.36% | +3.82 | +0.0382 | [0.0035, 0.0729] |

## Efficiency Readout

Available efficiency signal from the frozen artifacts:

- median payload bytes, `Normalized State`: `1616.5`
- median payload bytes, `Tasklog Re-entry`: `1535.5`
- delta: `-81.0` bytes
- ratio: `0.9499x`

Safe interpretation:

- Tasklog is not winning by inflating prompt payload size
- this round supports a favorable `context surface` readout
- this round does not yet support a strong runtime token / latency / cost claim

## Safe Claim

`On a frozen structured work-reentry holdout, Tasklog Re-entry improves re-entry quality over a fair Normalized State baseline across three required model slots.`

## Still Not Claimed

- broad Q1-safe interactive superiority
- runtime efficiency parity
- general coding-agent continuation
- universal smaller-model advantage
