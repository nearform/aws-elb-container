/*
 * THIS SOFTWARE IS PROVIDED ``AS IS'' AND ANY EXPRESSED OR IMPLIED
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED.  IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT,
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
 * STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
 * IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';



/**
 * add the nominated instance to the tiers load balancer
 */
exports.balancerAdd = function(elb, lbName, instanceId, cb) {
  elb.registerInstancesWithLoadBalancer({LoadBalancerName: lbName, Instances: [{InstanceId: instanceId}]}, function(err) {
    cb(err);
  });
};



/*
var add = function(instance, inst, instances) {
  var result;
  if (instances) {
    if (instances.length === 0) {
      result = false;
    }
  }
  else  {
    result = instance.InstanceId !== inst.InstanceId;
  }
  return result;
};
*/



/*
var remove = function(instance, inst, instances) {
  var result;
  if (instances) {
    if (instances.length !== 0) {
      result = false;
    }
  }
  else  {
    result = instance.InstanceId === inst.InstanceId;
  }
  return result;
};
*/


/**
 * fetch details about instances against a gven balancer
 */
/*
exports.getBalancerInstances = function(elb, lbName, cb) {
  elb.describeLoadBalancers({LoadBalancerNames : [lbName]}, function(err, data) {
    if (err) { return cb(err); }
    cb(null, data.LoadBalancerDescriptions[0].Instances);
  });
};
*/



/**
 * poll for addition of instance to balancer
 */
/*
var pollInstance = function(elb, lbName, func, instance, cb) {
  var continuePoll = true;
  exports.getBalancerInstances(region, tier, function(err, instances) {
    if (err) { return cb(err); }
    _.each(instances, function(inst) {
      if (continuePoll) {
        continuePoll = func(instance, inst);
      }
    });
    if (continuePoll) {
      continuePoll = func(null, null, instances);
    }
    if (continuePoll) {
      console.log('polling');
      setTimeout(function() {
        pollInstance(func, region, tier, instance, cb);
      }, 1000);
    }
    else {
      cb(err);
    }
  });
};
*/

